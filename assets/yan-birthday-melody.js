/* Original birthday theme for Yan's space mission.
   Web Audio synthesizer: no external audio files, no autoplay. */
(function () {
  "use strict";
  function init() {
    var screen = document.getElementById("screen5");
    var ticket = document.getElementById("ticket-open");
    var sound = document.getElementById("sound-switch");
    if (!screen || !ticket || !sound || document.getElementById("birthday-music")) return;

    var css = document.createElement("style");
    css.textContent = ".birthday-music{width:100%;max-width:420px;min-height:62px;margin:16px auto 4px;border:2px solid #98e8ff;border-radius:19px;background:linear-gradient(125deg,#3657ba,#6f48bb);color:#fff;font-size:clamp(16px,4.6vw,20px);font-weight:900;box-shadow:0 6px 0 #202b72,0 11px 19px #0005;touch-action:manipulation;cursor:pointer}.birthday-music:focus-visible{outline:3px solid #ffdc78;outline-offset:3px}.birthday-music:active{transform:translateY(3px);box-shadow:0 3px 0 #202b72}";
    document.head.appendChild(css);

    var button = document.createElement("button");
    button.type = "button";
    button.id = "birthday-music";
    button.className = "birthday-music";
    button.textContent = "🎵 Включить праздничную мелодию";
    button.setAttribute("aria-pressed", "false");
    screen.insertBefore(button, ticket);

    var context = null, master = null, nodes = [], finishTimer = null, playing = false;
    var beat = 60 / 152;
    // Eight original, cheerful measures in G major.
    var melody = [
      [392,.5],[493.88,.5],[587.33,1],[783.99,1],[659.25,1],
      [587.33,.5],[659.25,.5],[783.99,1],[880,1],[783.99,1],
      [659.25,1],[587.33,.5],[493.88,.5],[440,1],[587.33,1],
      [493.88,1],[392,.5],[440,.5],[493.88,1],[587.33,1],
      [783.99,.5],[739.99,.5],[659.25,1],[587.33,.5],[493.88,.5],[587.33,1],
      [659.25,.5],[783.99,.5],[880,1],[987.77,.5],[880,.5],[783.99,1],
      [659.25,1],[587.33,.5],[493.88,.5],[440,.5],[493.88,.5],[587.33,1],
      [783.99,2],[587.33,1],[783.99,1]
    ];
    var chords = [
      [196,246.94,293.66],[174.61,220,261.63],
      [164.81,196,246.94],[146.83,185,220],
      [196,246.94,293.66],[174.61,220,261.63],
      [164.81,220,261.63],[196,246.94,293.66]
    ];
    function enabled() { return sound.getAttribute("aria-pressed") === "true"; }
    function visible() { return screen.classList.contains("active"); }
    function label() {
      button.textContent = playing ? "⏹ Остановить мелодию" :
        (enabled() ? "🎶 Сыграть праздничную мелодию" : "🎵 Включить праздничную мелодию");
      button.setAttribute("aria-pressed", String(playing));
    }
    function unlock() {
      try {
        var C = window.AudioContext || window.webkitAudioContext;
        if (!C) return false;
        if (!context) context = new C();
        if (context.state === "suspended") {
          var r = context.resume();
          if (r && typeof r.catch === "function") r.catch(function () {});
        }
        return true;
      } catch (err) { return false; }
    }
    function stop() {
      if (finishTimer !== null) { clearTimeout(finishTimer); finishTimer = null; }
      if (master && context) {
        try { master.gain.cancelScheduledValues(context.currentTime); master.gain.setTargetAtTime(0.0001,context.currentTime,.025); } catch (err) {}
      }
      nodes.forEach(function (o) { try { o.stop(); } catch (err) {} });
      nodes = [];
      playing = false;
      label();
    }
    function note(freq, at, len, vol, wave) {
      var osc = context.createOscillator(), gain = context.createGain(), end = at + len;
      osc.type = wave || "triangle";
      osc.frequency.setValueAtTime(freq, at);
      gain.gain.setValueAtTime(.0001, at);
      gain.gain.linearRampToValueAtTime(vol, at+.012);
      gain.gain.exponentialRampToValueAtTime(Math.max(.0002,vol*.3), Math.max(at+.04,end-.075));
      gain.gain.exponentialRampToValueAtTime(.0001, end);
      osc.connect(gain);
      gain.connect(master);
      osc.start(at);
      osc.stop(end+.012);
      nodes.push(osc);
    }
    function play() {
      if (!enabled() || !unlock()) { label(); return; }
      stop();
      master = context.createGain();
      master.gain.setValueAtTime(.26,context.currentTime);
      master.connect(context.destination);
      var at = context.currentTime + .11, pos = 0;
      melody.forEach(function (n) {
        var duration = n[1] * beat;
        note(n[0],at+pos*beat,duration*.91,.23,"triangle");
        note(n[0]*2,at+pos*beat,duration*.55,.055,"sine");
        pos += n[1];
      });
      chords.forEach(function (ch,i) {
        var bar = at + i*4*beat;
        note(ch[0],bar,beat*.72,.11,"sine");
        note(ch[1],bar+beat,beat*.70,.07,"triangle");
        note(ch[2],bar+2*beat,beat*.70,.08,"triangle");
        note(ch[1]*2,bar+3*beat,beat*.55,.045,"sine");
      });
      playing = true; label();
      finishTimer = setTimeout(function () {
        finishTimer = null;
        playing = false;
        label();
        nodes = [];
      },(pos*beat+.45)*1000);
    }

    sound.addEventListener("click", function () {
      if (!enabled()) stop();
      else { unlock(); if (visible()) play(); else label(); }
    });
    button.addEventListener("click", function () {
      if (playing) { stop(); return; }
      if (!enabled()) { sound.click(); return; }
      play();
    });
    var wasVisible = visible();
    var observer = new MutationObserver(function () {
      var now = visible();
      if (now && !wasVisible && enabled()) play();
      if (!now && wasVisible) stop();
      wasVisible = now;
    });
    observer.observe(screen,{attributes:true,attributeFilter:["class"]});
    document.addEventListener("visibilitychange",function () { if (document.hidden) stop(); });
    label();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",init);
  else init();
})();