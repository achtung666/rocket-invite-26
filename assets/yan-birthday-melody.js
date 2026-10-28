/* Seamless music for Yan's birthday quest: one iOS-approved media player. */
(function(){
"use strict";
function init(){
 var scenes=[].slice.call(document.querySelectorAll("#yan-app .screen"));
 var sound=document.getElementById("sound-switch"),
     start=document.getElementById("start"),skip=document.getElementById("skip"),
     restart=document.getElementById("restart"),ticket=document.getElementById("ticket-open");
 if(scenes.length!==6||!sound||!start||!skip||!restart||!ticket||
    document.getElementById("birthday-music"))return;
 var LOOP=12.37,HAPPY=13.276,END=25.963,FIRST=.035;
 try{if(navigator.audioSession)navigator.audioSession.type="playback"}catch(e){}
 var css=document.createElement("style");
 css.textContent=".birthday-music{width:100%;max-width:420px;min-height:62px;margin:16px auto 4px;border:2px solid #98e8ff;border-radius:19px;background:linear-gradient(125deg,#3657ba,#6f48bb);color:#fff;font-size:clamp(16px,4.6vw,20px);font-weight:900;box-shadow:0 6px 0 #202b72,0 11px 19px #0005;touch-action:manipulation;cursor:pointer}.birthday-music:focus-visible,.audio-unlock:focus-visible{outline:3px solid #ffdc78;outline-offset:3px}.birthday-music:active{transform:translateY(3px);box-shadow:0 3px 0 #202b72}.audio-unlock{position:relative;z-index:3;width:min(100%,360px);min-height:42px;margin:4px auto 10px;border:1px solid #ffe29d;border-radius:12px;background:#f9db82;color:#27315b;font-size:14px;font-weight:900;touch-action:manipulation}.audio-unlock[hidden]{display:none!important}";
 document.head.appendChild(css);
 var btn=document.createElement("button");
 btn.id="birthday-music";btn.type="button";btn.className="birthday-music";
 btn.setAttribute("aria-pressed","false");scenes[5].insertBefore(btn,ticket);
 var recover=document.createElement("button");
 recover.id="audio-unlock";recover.type="button";recover.className="audio-unlock";
 recover.hidden=true;recover.textContent="▶ Включить звук";
 var progress=document.querySelector("#yan-app .progress");
 if(progress&&progress.parentNode)progress.parentNode.insertBefore(recover,progress.nextSibling);
 else document.getElementById("yan-app").appendChild(recover);
 var audio=document.createElement("audio");
 audio.id="yan-score";audio.src="assets/yan-seamless-music.wav?v=7";
 audio.preload="auto";audio.volume=.85;audio.setAttribute("playsinline","");
 audio.style.display="none";document.body.appendChild(audio);
 var entered=false,mode=null,finished=false,serial=0,retry=null;
 function on(){return sound.getAttribute("aria-pressed")==="true"}
 function foreground(){return !document.hidden}
 function stage(){for(var i=0;i<scenes.length;i++)if(scenes[i].classList.contains("active"))return i;return -1}
 function target(){var n=stage();return n===5?"birthday":(n>0&&n<5?"quest":null)}
 function setTime(t){try{audio.currentTime=t}catch(e){}}
 function label(){
  var playing=mode==="birthday"&&!finished&&!audio.paused;
  btn.textContent=playing?"⏹ Остановить Happy Birthday":
   on()?"🎂 Сыграть Happy Birthday 🎵":"🎵 Включить праздничную музыку";
  btn.setAttribute("aria-pressed",String(playing));
 }
 function showError(){if(entered&&on()&&foreground()&&!finished)recover.hidden=false}
 function clearError(){recover.hidden=true}
 function stop(){++serial;audio.pause();mode=null;finished=false;clearError();label()}
 function play(){
  if(!entered||!on()||!foreground()||!mode||finished)return;
  if(!audio.paused){clearError();label();return}
  var id=++serial,r;
  try{r=audio.play()}catch(e){showError();return}
  if(r&&typeof r.then==="function"){
   r.then(function(){if(id===serial){clearError();label()}},
          function(){if(id===serial)showError()});
  }else{clearError();label()}
 }
 function sync(){
  if(!entered){label();return}
  if(!on()){audio.pause();clearError();label();return}
  var next=target();
  if(!next){stop();return}
  if(next!==mode){
   mode=next;finished=false;clearError();
   setTime(next==="birthday"?HAPPY:FIRST);
  }
  // When reaching the finale, the SAME playing audio stream simply seeks to
  // Happy Birthday, without the second media authorization required by Safari.
  if(!finished&&foreground()&&audio.paused)play();
  label();
 }
 function enter(){entered=true;sync()}
 start.addEventListener("click",enter);
 skip.addEventListener("click",enter);
 restart.addEventListener("click",function(){stop();entered=false;setTime(FIRST)});
 sound.addEventListener("click",function(){
  if(!on()){++serial;audio.pause();clearError()}
  else if(entered){if(finished&&mode==="birthday"){finished=false;setTime(HAPPY)}sync()}
  label();
 });
 btn.addEventListener("click",function(){
  entered=true;
  if(mode==="birthday"&&!finished&&!audio.paused){
   audio.pause();finished=true;clearError();label();return
  }
  if(!on())sound.click();
  mode="birthday";finished=false;setTime(HAPPY);play();label();
 });
 recover.addEventListener("click",function(){if(entered&&on())sync()});
 audio.addEventListener("loadedmetadata",function(){if(mode==="birthday")setTime(HAPPY)});
 audio.addEventListener("timeupdate",function(){
  if(!entered||!on())return;
  if(mode==="quest"&&audio.currentTime>=LOOP)setTime(FIRST);
  if(mode==="birthday"&&audio.currentTime>=END){
   audio.pause();finished=true;clearError();label()
  }
 });
 audio.addEventListener("ended",function(){
  if(mode==="birthday"){finished=true;clearError();label()}
  else if(mode==="quest"&&entered&&on()){setTime(FIRST);play()}
 });
 audio.addEventListener("error",showError);
 var observer=new MutationObserver(sync);
 scenes.forEach(function(s){observer.observe(s,{attributes:true,attributeFilter:["class"]})});
 function resume(){
  if(!entered||!on()||!foreground())return;
  sync();
  if(retry!==null)clearTimeout(retry);
  retry=setTimeout(function(){retry=null;if(foreground())sync()},350);
 }
 document.addEventListener("visibilitychange",function(){if(foreground())resume()});
 window.addEventListener("pageshow",resume);
 window.addEventListener("focus",resume);
 // Do not pause on pagehide/blur, and never overlay the invitation.
 label();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);
else init();
})();