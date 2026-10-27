/* Music for Yan's space quest: original looping mission theme and the
   traditional public-domain "Happy Birthday to You" melody at the finale.
   All notes are synthesized locally; sound unlocks only on a user tap. */
(function () {
  "use strict";
  function init() {
    var screen = document.getElementById("screen5");
    var ticket = document.getElementById("ticket-open");
    var sound = document.getElementById("sound-switch");
    var start = document.getElementById("start");
    var skip = document.getElementById("skip");
    var restart = document.getElementById("restart");
    if (!screen || !ticket || !sound || !start || !skip || !restart ||
        document.getElementById("birthday-music")) return;

    var css = document.createElement("style");
    css.textContent = ".birthday-music{width:100%;max-width:420px;min-height:62px;margin:16px auto 4px;border:2px solid #98e8ff;border-radius:19px;background:linear-gradient(125deg,#3657ba,#6f48bb);color:#fff;font-size:clamp(16px,4.6vw,20px);font-weight:900;box-shadow:0 6px 0 #202b72,0 11px 19px #0005;touch-action:manipulation;cursor:pointer}.birthday-music:focus-visible{outline:3px solid #ffdc78;outline-offset:3px}.birthday-music:active{transform:translateY(3px);box-shadow:0 3px 0 #202b72}";
    document.head.appendChild(css);
    var button = document.createElement("button");
    button.type = "button";
    button.id = "birthday-music";
    button.className = "birthday-music";
    button.setAttribute("aria-pressed", "false");
    screen.insertBefore(button, ticket);

    var context = null, master = null, oscillators = [], timer = null;
    var mode = "idle", playing = false, userMuted = false, automaticToggle = false;
    var beat = 60 / 152, birthdayBeat = 60 / 118;

    // Original, cheerful space melody for the entire quest.
    var spaceNotes = [
      [392,.5],[493.88,.5],[587.33,1],[783.99,1],[659.25,1],
      [587.33,.5],[659.25,.5],[783.99,1],[880,1],[783.99,1],
      [659.25,1],[587.33,.5],[493.88,.5],[440,1],[587.33,1],
      [493.88,1],[392,.5],[440,.5],[493.88,1],[587.33,1],
      [783.99,.5],[739.99,.5],[659.25,1],[587.33,.5],[493.88,.5],[587.33,1],
      [659.25,.5],[783.99,.5],[880,1],[987.77,.5],[880,.5],[783.99,1],
      [659.25,1],[587.33,.5],[493.88,.5],[440,.5],[493.88,.5],[587.33,1],
      [783.99,2],[587.33,1],[783.99,1]
    ];
    var spaceChords = [
      [196,246.94,293.66],[174.61,220,261.63],
      [164.81,196,246.94],[146.83,185,220],
      [196,246.94,293.66],[174.61,220,261.63],
      [164.81,220,261.63],[196,246.94,293.66]
    ];

    // Traditional Happy Birthday melody, in C major.
    var birthdayNotes = [
      [392,.75],[392,.25],[440,1],[392,1],[523.25,1],[493.88,2],
      [392,.75],[392,.25],[440,1],[392,1],[587.33,1],[523.25,2],
      [392,.75],[392,.25],[783.99,1],[659.25,1],[523.25,1],[493.88,1],[440,2],
      [698.46,.75],[698.46,.25],[659.25,1],[523.25,1],[587.33,1],[523.25,2]
    ];
    var birthdayBass = [130.81,196,130.81,174.61,130.81,196,130.81,174.61,130.81,196,130.81,130.81,130.81];
    function enabled() { return sound.getAttribute("aria-pressed") === "true"; }
    function finale() { return screen.classList.contains("active"); }
    function inQuest() {
      for (var i = 1; i < 5; i++) {
        var s = document.getElementById("screen" + i);
        if (s && s.classList.contains("active")) return true;
      }
      return false;
    }
    function label() {
      button.textContent = playing && mode === "birthday" ?
        "⏹ Остановить Happy Birthday" :
        (enabled() ? "🎂 Сыграть Happy Birthday 🎵" : "🎵 Включить праздничную музыку");
      button.setAttribute("aria-pressed", String(playing && mode === "birthday"));
    }
    function unlock() {
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        if (!context) context = new AC();
        if (context.state === "suspended") {
          var resume = context.resume();
          if (resume && typeof resume.catch === "function") resume.catch(function () {});
        }
        return true;
      } catch (err) { return false; }
    }
    function stop() {
      if (timer !== null) { clearTimeout(timer); timer = null; }
      if (master && context) {
        try {
          master.gain.cancelScheduledValues(context.currentTime);
          master.gain.setTargetAtTime(.0001, context.currentTime, .012);
        } catch (err) {}
      }
      oscillators.forEach(function (o) {
        try { o.stop(context.currentTime + .055); } catch (err) {}
      });
      oscillators = [];
      mode = "idle";
      playing = false;
      label();
    }
    function note(freq, at, len, vol, wave) {
      if (!Number.isFinite(freq) || !context) return;
      var osc = context.createOscillator();
      var gain = context.createGain();
      var end = at + len;
      osc.type = wave || "triangle";
      osc.frequency.setValueAtTime(freq, at);
      gain.gain.setValueAtTime(.0001, at);
      gain.gain.linearRampToValueAtTime(vol, at + .012);
      gain.gain.exponentialRampToValueAtTime(Math.max(.0002, vol * .34), Math.max(at + .04, end - .075));
      gain.gain.exponentialRampToValueAtTime(.0001, end);
      osc.connect(gain);
      gain.connect(master);
      osc.start(at);
      osc.stop(end + .012);
      oscillators.push(osc);
    }
    function schedulePhrase(notes, secondsPerBeat, at, isBirthday) {
      var beats = 0;
      notes.forEach(function (n) {
        var seconds = n[1] * secondsPerBeat;
        var current = at + beats * secondsPerBeat;
        note(n[0], current, seconds * .91, isBirthday ? .28 : .20, "triangle");
        note(n[0] * 2, current, seconds * .62, .045, "sine");
        beats += n[1];
      });
      return beats * secondsPerBeat;
    }
    function begin(kind) {
      if (!enabled() || document.hidden || !unlock()) { label(); return; }
      if (playing && mode === kind) return;
      stop();
      master = context.createGain();
      master.gain.setValueAtTime(kind === "birthday" ? .33 : .20, context.currentTime);
      master.connect(context.destination);
      var at = context.currentTime + .065;
      var length;
      if (kind === "birthday") {
        length = schedulePhrase(birthdayNotes, birthdayBeat, at, true);
        birthdayBass.forEach(function (freq, i) {
          var when = at + i * 2 * birthdayBeat;
          if (when < at + length) note(freq, when, 1.5 * birthdayBeat, .075, "sine");
        });
      } else {
        length = schedulePhrase(spaceNotes, beat, at, false);
        spaceChords.forEach(function (ch, i) {
          var t = at + i * 4 * beat;
          if (t < at + length) {
            note(ch[0], t, beat * .72, .095, "sine");
            note(ch[1], t + beat, beat * .70, .06, "triangle");
            note(ch[2], t + beat * 2, beat * .70, .07, "triangle");
            note(ch[1] * 2, t + beat * 3, beat * .55, .038, "sine");
          }
        });
      }
      mode = kind; playing = true; label();
      timer = setTimeout(function () {
        timer = null; playing = false; mode = "idle"; oscillators = [];
        if (kind === "quest" && enabled() && !document.hidden && inQuest()) {
          begin("quest"); // Continuous melody through all quest steps.
        } else label();  // Happy Birthday ends naturally; button can replay it.
      }, (length + .13) * 1000);
    }
    function synchronize() {
      if (!enabled() || document.hidden) { stop(); return; }
      if (finale()) {
        if (!playing || mode !== "birthday") begin("birthday");
      } else if (inQuest()) {
        if (!playing || mode !== "quest") begin("quest");
      } else stop();
    }
    function onEntry() {
      if (!enabled() && !userMuted) {
        automaticToggle = true;
        try { sound.click(); } finally { automaticToggle = false; }
      }
      if (enabled()) { unlock(); synchronize(); }
    }
    sound.addEventListener("click", function () {
      if (!automaticToggle) userMuted = !enabled();
      if (enabled()) { unlock(); synchronize(); }
      else stop();
    });
    start.addEventListener("click", onEntry);
    skip.addEventListener("click", onEntry);
    restart.addEventListener("click", stop);
    button.addEventListener("click", function () {
      if (playing && mode === "birthday") { stop(); return; }
      if (!enabled()) {
        userMuted = false;
        sound.click();  // In the click gesture, unlock sound on iOS.
      } else begin("birthday");
    });
    var observer = new MutationObserver(function () { synchronize(); });
    for (var i = 0; i < 6; i++) {
      var scene = document.getElementById("screen" + i);
      if (scene) observer.observe(scene, {attributes:true, attributeFilter:["class"]});
    }
    document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); });
    label();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();