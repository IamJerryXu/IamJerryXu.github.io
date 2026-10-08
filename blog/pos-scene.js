'use strict';
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('[data-pos-scene]').forEach(scene => {
    const world = scene.querySelector('.pos-world'), actor = scene.querySelector('.pos-actor');
    const position = scene.querySelector('.pos-actor-position'), pose = scene.querySelector('.pos-actor-pose');
    const next = scene.querySelector('.pos-next'), verify = scene.querySelector('.pos-verify');
    const caption = scene.querySelector('.pos-scene-caption'), memory = scene.querySelector('.pos-memory-line');
    const description = {
      visible: ['Here is our target. The small portrait below stands for a record that has already been verified.', '这是要跟住的目标。下面的小肖像代表一份已经核验通过的记录。'],
      passing: ['Our view is changing. The stored record stays put while the character passes behind the cloud.', '眼前的画面在变，保留的记录没有跟着变。角色正在经过云层。'],
      hidden: ['We cannot see the target now. That does not erase its record: the state below is still there.', '现在看不见目标了，但这不等于忘掉它：下方保留的状态还在。'],
      candidate: ['It is back in view. This is only a possible match so far; the old record has not been replaced.', '它重新出现了。目前还只是一个候选匹配，旧记录尚未被替换。'],
      verified: ['In this illustrated case, verification supports the match. Only now do we carry the new evidence into the next state.', '在这个示意情形中，核验支持了这次匹配。到这一步，新证据才进入下一份状态。']
    };
    let x=.12, target=.12, velocity=0, raf=0, previous=0, dragging=false, verified=false, state='', moodTimer=0;
    let capture=null, dirty=true, stateWritten=false, grabOffset=0, pointerTime=0, pointerX=0;
    const zh=()=>document.documentElement.lang.startsWith('zh');
    const choose=pair=>pair[zh()?1:0];
    const setMood=mood=>actor.dataset.mood=mood;
    const phase=()=>verified&&x>.67?'verified':x>.67?'candidate':x>.45&&x<.55?'hidden':x>.30?'passing':'visible';
    const updateText=()=>{
      const name=phase(), changed=name!==state; state=name; scene.dataset.state=name;
      if(changed||dirty){
        caption.textContent=choose(description[name]);
        memory.textContent=choose(stateWritten?['New evidence, carried into the same object state.','新证据已写入，延续的仍是同一目标。']:['The last verified record stays here.','上一次核验通过的记录，留在这里。']);
        const label=x<.42?['Into the cloud','走到云后']:x<=.67?['Back into view','让它走出来']:['Try again','再走一次'];
        next.querySelector('span').textContent=choose(label);
        verify.textContent=choose(verified?['Update shown','已展示更新']:['Show a verified update','查看核验后的一种更新']);
        actor.setAttribute('aria-label',choose(['Move the character. Use left and right arrow keys.','移动角色，可使用左右方向键。']));
        scene.setAttribute('aria-label',choose(['Concept illustration of persistent object memory','持续对象记忆的概念示意']));
        dirty=false;
      }
      verify.disabled=name!=='candidate'||dragging;
      actor.setAttribute('aria-valuenow',Math.round(x*100));
      actor.setAttribute('aria-valuetext',choose(name==='hidden'?['Behind the cloud; state retained','云后，状态保留']:name==='candidate'?['Back in view; match not yet verified','重新出现，匹配尚未核验']:name==='verified'?['Illustrated update complete','示意更新完成']:['In view','在视野中']));
    };
    const paint=()=>{
      position.style.left=`${x*100}%`;
      const speed=Math.min(1,Math.abs(velocity)*2), bob=reduced.matches?0:Math.sin(x*95)*speed*2;
      pose.style.transform=`translateY(${bob.toFixed(2)}px) rotate(${reduced.matches?0:Math.max(-4,Math.min(4,velocity*6))}deg) scale(${1+speed*.025},${1-speed*.025})`;
      updateText();
    };
    const tick=now=>{
      const dt=previous?Math.min((now-previous)/1000,.025):.016;previous=now;
      const k=155,c=25;
      velocity+=(k*(target-x)-c*velocity)*dt;x+=velocity*dt;x=Math.max(.12,Math.min(.88,x));
      paint();
      if(Math.abs(target-x)>.0002||Math.abs(velocity)>.001){raf=requestAnimationFrame(tick);}
      else{x=target;velocity=0;raf=0;previous=0;paint();if(!dragging&&!verified)setMood(x>.67?'curious':'');}
    };
    const move=to=>{
      target=Math.max(.12,Math.min(.88,to));verified=false;scene.classList.remove('is-writing');dirty=true;
      if(reduced.matches){x=target;velocity=0;paint();return;}
      if(!raf){previous=0;raf=requestAnimationFrame(tick);}
    };
    const advance=()=>{if(x>.67)stateWritten=false;move(x<.42?.5:x<=.67?.86:.12);};
    next.addEventListener('click',advance);
    verify.addEventListener('click',()=>{
      if(phase()!=='candidate')return;
      verified=true;stateWritten=true;dirty=true;paint();setMood('happy');
      scene.classList.remove('is-writing');void scene.offsetWidth;scene.classList.add('is-writing');
      clearTimeout(moodTimer);moodTimer=setTimeout(()=>{setMood('');scene.classList.remove('is-writing');},800);
    });
    const fromPointer=e=>{const b=world.getBoundingClientRect();return(e.clientX-b.left)/b.width;};
    const followPointer=e=>{
      const now=performance.now(), nextX=Math.max(.12,Math.min(.88,fromPointer(e)-grabOffset));
      const dt=Math.max(.008,(now-pointerTime)/1000);
      velocity=reduced.matches?0:Math.max(-1.8,Math.min(1.8,(nextX-pointerX)/dt));
      x=target=nextX;pointerX=x;pointerTime=now;verified=false;dirty=true;
      scene.classList.remove('is-writing');paint();
    };
    actor.addEventListener('pointerdown',e=>{
      if(e.button!==0)return;
      cancelAnimationFrame(raf);raf=0;previous=0;clearTimeout(moodTimer);
      dragging=true;capture=e.pointerId;grabOffset=fromPointer(e)-x;pointerX=x;pointerTime=performance.now();velocity=0;
      actor.setPointerCapture(e.pointerId);setMood('grabbed');paint();
    });
    actor.addEventListener('pointermove',e=>{if(dragging&&capture===e.pointerId)followPointer(e);});
    const release=e=>{
      if(!dragging||e.pointerId!==capture)return;
      dragging=false;capture=null;
      if(actor.hasPointerCapture(e.pointerId))actor.releasePointerCapture(e.pointerId);
      if(performance.now()-pointerTime>90||e.type!=='pointerup')velocity=0;
      move(x>.42&&x<.58?.5:x+velocity*.035);
      setMood(x>.67?'curious':'');paint();
    };
    actor.addEventListener('pointerup',release);actor.addEventListener('pointercancel',release);actor.addEventListener('lostpointercapture',release);
    actor.addEventListener('keydown',e=>{
      const keys={ArrowLeft:target-.08,ArrowRight:target+.08,Home:.12,End:.86};
      if(e.key in keys){e.preventDefault();move(keys[e.key]);}
      else if(e.key==='Enter'||e.key===' '){e.preventDefault();advance();}
    });
    actor.addEventListener('pointerenter',()=>{if(dragging||verified||reduced.matches)return;setMood('curious');clearTimeout(moodTimer);moodTimer=setTimeout(()=>setMood(''),180);});
    const settle=()=>{cancelAnimationFrame(raf);raf=0;previous=0;velocity=0;x=target;paint();};
    new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)settle();}).observe(scene);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)settle();});
    window.addEventListener('pagehide',()=>{settle();clearTimeout(moodTimer);});
    reduced.addEventListener('change',settle);
    new MutationObserver(()=>{dirty=true;updateText();}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
    actor.disabled=false;actor.tabIndex=0;scene.querySelector('.pos-scene-controls').hidden=false;scene.classList.add('is-enhanced');paint();
  });
})();
