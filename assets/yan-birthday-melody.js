/* Yan's birthday game audio v6.
   Use native HTMLAudioElement (media playback) instead of WebAudio.
   This makes music audible on iOS with the ring/silent switch enabled.
   Only start in a user gesture; resume safely after page suspension. */
(function () {
"use strict";
function init() {
  var scenes = Array.prototype.slice.call(document.querySelectorAll("#yan-app .screen"));
  var sound = document.getElementById("sound-switch");
  var ticket = document.getElementById("ticket-open");
  var start = document.getElementById("start");
  var skip = document.getElementById("skip");
  var restart = document.getElementById("restart");
  if (!sound || !ticket || !start || !skip || !restart || scenes.length !== 6 ||
      document.getElementById("birthday-music")) return;
  try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {}

  var style = document.createElement("style");
  style.textContent =
    ".birthday-music{width:100%;max-width:420px;min-height:62px;margin:16px auto 4px;border:2px solid #98e8ff;border-radius:19px;background:linear-gradient(125deg,#3657ba,#6f48bb);color:#fff;font-size:clamp(16px,4.6vw,20px);font-weight:900;box-shadow:0 6px 0 #202b72,0 11px 19px #0005;touch-action:manipulation;cursor:pointer}" +
    ".birthday-music:focus-visible,.music-resume:focus-visible{outline:3px solid #ffdc78;outline-offset:3px}" +
    ".birthday-music:active{transform:translateY(3px);box-shadow:0 3px 0 #202b72}" +
    ".music-resume{position:fixed;left:50%;bottom:calc(20px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:1005;width:min(94vw,390px);min-height:62px;padding:12px;border:2px solid #fff2aa;border-radius:20px;background:#ffdb74;color:#212044;font-size:18px;font-weight:900;box-shadow:0 8px 25px #0009;cursor:pointer}" +
    ".music-resume[hidden]{display:none!important}";
  document.head.appendChild(style);

  var button = document.createElement("button");
  button.type = "button"; button.className = "birthday-music";
  button.id = "birthday-music";
  button.setAttribute("aria-pressed","false");
  scenes[5].insertBefore(button, ticket);

  var resumeButton = document.createElement("button");
  resumeButton.type = "button";
  resumeButton.id = "music-resume";
  resumeButton.className = "music-resume";
  resumeButton.textContent = "▶ Продолжить музыку";
  resumeButton.hidden = true;
  resumeButton.setAttribute("aria-label","Продолжить музыку после возвращения в браузер");
  document.body.appendChild(resumeButton);

  function audioTrack(src, repeat, volume) {
    var el = document.createElement("audio");
    el.src = src; el.preload = "auto"; el.loop = repeat; el.volume = volume;
    el.setAttribute("preload","auto");
    el.setAttribute("playsinline","");
    el.setAttribute("aria-hidden","true");
    el.style.display = "none";
    document.body.appendChild(el);
    return el;
  }
  var quest = audioTrack("assets/yan-quest-theme.wav?v=6", true, .85);
  var birthday = audioTrack("assets/yan-happy-birthday.wav?v=6", false, .95);
  var current = null, kind = null, finished = false, manualMute = false;
  var automaticToggle = false, resumeNeeded = false, backgroundPaused = false;
  var requestId = 0;

  function enabled() { return sound.getAttribute("aria-pressed") === "true"; }
  function visible() { return !document.hidden; }
  function stage() {
    for (var i = 0; i < scenes.length; i++) {
      if (scenes[i].classList.contains("active")) return i;
    }
    return -1;
  }
  function wanted() {
    var n = stage();
    if (n === 5) return "birthday";
    if (n >= 1 && n <= 4) return "quest";
    return null;
  }
  function updateLabel() {
    button.textContent = kind === "birthday" && current === birthday && !birthday.paused && !birthday.ended
      ? "⏹ Остановить Happy Birthday"
      : enabled() ? "🎂 Сыграть Happy Birthday 🎵" : "🎵 Включить праздничную музыку";
    button.setAttribute("aria-pressed", String(kind === "birthday" && current === birthday && !birthday.paused));
  }
  function setResume(need) {
    resumeNeeded = !!need;
    resumeButton.hidden = !resumeNeeded;
    updateLabel();
  }
  function stopTracks() {
    requestId++;
    quest.pause(); birthday.pause();
    current = null; kind = null; finished = false; backgroundPaused = false;
    setResume(false);
  }
  function tryPlay(track) {
    if (!visible() || !enabled() || current !== track) return;
    var id = ++requestId;
    var promise;
    try { promise = track.play(); }
    catch (err) { setResume(true); return; }
    if (promise && typeof promise.then === "function") {
      promise.then(function () {
        if (id === requestId && current === track) {
          backgroundPaused = false;
          setResume(false);
        }
      }, function () {
        if (id === requestId && current === track && enabled() && visible()) {
          setResume(true);  // Browser needs a new user gesture.
        }
      });
    } else setResume(false);
    updateLabel();
  }
  function select(mode, reset) {
    var track = mode === "quest" ? quest : birthday;
    if (current !== track) {
      requestId++;
      if (current) current.pause();
      current = track;
      kind = mode;
      finished = false; backgroundPaused = false;
      try { track.currentTime = 0; } catch (e) {}
    } else if (reset) {
      requestId++; track.pause();
      finished = false;
      try { track.currentTime = 0; } catch (e) {}
    }
    if (!finished && track.paused) tryPlay(track);
    updateLabel();
  }
  function synchronize() {
    if (!enabled() || !visible()) {
      if (!enabled()) stopTracks();
      return;
    }
    var mode = wanted();
    if (!mode) {
      if (current) stopTracks();
      return;
    }
    if (mode === "birthday" && current === birthday && finished) {
      updateLabel();
      return;
    }
    select(mode,false);
  }
  function enterQuestOrInvite() {
    // Directly inside click: iOS allows media playback after a real tap.
    if (!enabled() && !manualMute) {
      automaticToggle = true;
      try { sound.click(); } finally { automaticToggle = false; }
    }
    if (enabled()) synchronize();
  }
  sound.addEventListener("click", function () {
    if (!automaticToggle) manualMute = !enabled();
    if (enabled()) { finished = false; synchronize(); }
    else stopTracks();
    updateLabel();
  });
  start.addEventListener("click",enterQuestOrInvite);
  skip.addEventListener("click",enterQuestOrInvite);
  restart.addEventListener("click",function () {
    stopTracks();
    // Do not play until child taps Start again.
  });
  button.addEventListener("click",function () {
    if (kind === "birthday" && current === birthday && !birthday.paused) {
      birthday.pause(); finished = true; setResume(false); return;
    }
    if (!enabled()) {
      manualMute = false;
      automaticToggle = true;
      try { sound.click(); } finally { automaticToggle = false; }
    }
    if (enabled()) select("birthday",true);
  });
  resumeButton.addEventListener("click",function () {
    if (!enabled()) {
      manualMute = false;
      automaticToggle = true;
      try { sound.click(); } finally { automaticToggle = false; }
    }
    if (enabled()) synchronize();
  });

  birthday.addEventListener("ended", function () {
    if (current !== birthday) return;
    finished = true;
    setResume(false);
  });
  [quest,birthday].forEach(function (track) {
    track.addEventListener("error",function () {
      if (current === track && enabled()) setResume(true);
    });
  });

  var observer = new MutationObserver(function () { synchronize(); });
  scenes.forEach(function (s) {
    observer.observe(s,{attributes:true,attributeFilter:["class"]});
  });
  function suspend() {
    if (!visible() && current && !current.paused && enabled()) {
      backgroundPaused = true;
      current.pause();
    }
  }
  function comeBack() {
    if (!visible() || !enabled()) return;
    // Some Safari versions restore their media session after the visibility event.
    synchronize();
    window.setTimeout(function () { if (visible()) synchronize(); }, 350);
  }
  document.addEventListener("visibilitychange",function () {
    if (!visible()) suspend(); else comeBack();
  });
  window.addEventListener("pagehide",function () {
    if (current && !current.paused) { backgroundPaused = true; current.pause(); }
  });
  window.addEventListener("pageshow",comeBack);
  window.addEventListener("focus",comeBack);
  updateLabel();
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",init);
else init();
})();