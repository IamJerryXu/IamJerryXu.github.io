'use strict';
(() => {
  const desktop = matchMedia('(min-width: 801px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const nav = document.querySelector('.blog-nav');
  const items = [];
  let current = null, closingTimer = 0;
  const shell = document.createElement('div');
  shell.className = 'nav-shell'; shell.hidden = true;
  shell.innerHTML = '<div class="nav-shell-surface"><svg class="nav-shell-tip" width="32" height="12" viewBox="0 0 32 12" aria-hidden="true"><path/></svg><div class="nav-shell-clip"></div></div>';
  document.body.append(shell);
  const clip = shell.querySelector('.nav-shell-clip');
  const tipPath = shell.querySelector('.nav-shell-tip path');
  const tip = {value:0,velocity:0,target:0,frame:0,last:0,timer:0};
  function drawTip() {
    const p=tip.value,y=6*(1-p);
    tipPath.setAttribute('d',`M0 12 C${8*p} 12 9.6 ${y} 16 ${y} C22.4 ${y} ${32-8*p} 12 32 12 Z`);
  }
  function tickTip(now) {
    tip.frame=0;
    const dt=Math.min((now-(tip.last||now-16.67))/1000,.032);tip.last=now;
    tip.velocity+=((tip.target-tip.value)*300-tip.velocity*18)*dt;
    tip.value+=tip.velocity*dt;
    if(Math.abs(tip.target-tip.value)<.001&&Math.abs(tip.velocity)<.001){tip.value=tip.target;tip.velocity=0;tip.last=0;}
    else tip.frame=requestAnimationFrame(tickTip);
    drawTip();
  }
  function targetTip(value,instant=false) {
    tip.target=value;
    if(instant||reduced.matches){cancelAnimationFrame(tip.frame);tip.frame=0;tip.last=0;tip.value=value;tip.velocity=0;drawTip();}
    else if(!tip.frame)tip.frame=requestAnimationFrame(tickTip);
  }
  function revealTip(travel) {
    clearTimeout(tip.timer);
    if(reduced.matches){targetTip(1,true);return;}
    targetTip(0,!travel);
    tip.timer=setTimeout(()=>targetTip(1),travel?150:100);
  }
  drawTip();
  const isDesktop = item => desktop.matches && !item.mobile;
  const links = item => [...item.panel.querySelectorAll('a[href],button:not([disabled])')].filter(el=>getComputedStyle(el).display!=='none');
  function hidePanel(item) {
    clearTimeout(item.timer); item.panel.hidden = true; item.panel.inert = true;
    item.panel.setAttribute('aria-hidden','true'); item.panel.dataset.active = 'false';
  }
  function deactivate(item, animate = false) {
    item.button.setAttribute('aria-expanded','false'); item.wrapper.classList.remove('is-open');
    item.panel.inert = true; item.panel.setAttribute('aria-hidden','true'); item.panel.dataset.active='false';
    clearTimeout(item.timer);
    if (animate && !reduced.matches) item.timer=setTimeout(()=>hidePanel(item),250);
    else hidePanel(item);
  }
  function close(restore = false) {
    if (!current) return;
    const item=current; current=null;
    clearTimeout(tip.timer);cancelAnimationFrame(tip.frame);tip.frame=0;tip.last=0;tip.velocity=0;tip.target=tip.value;
    deactivate(item,isDesktop(item));
    if (!shell.hidden) {
      shell.classList.add('is-closing');
      clearTimeout(closingTimer);
      if(reduced.matches)shell.hidden=true;
      else closingTimer=setTimeout(()=>{shell.hidden=true;shell.classList.remove('is-closing');},250);
    }
    if(restore)item.button.focus({preventScroll:true});
  }
  function position(item, first = false) {
    const button=item.button.getBoundingClientRect();
    const width=item.button.dataset.navKey==='about'?300:230;
    item.panel.style.width=`${Math.min(width,innerWidth-32)}px`;
    const height=item.panel.getBoundingClientRect().height;
    const left=Math.max(16,Math.min(innerWidth-width-16,button.left+button.width/2-width/2));
    shell.classList.toggle('no-travel',first);
    shell.style.width=`${width}px`; shell.style.height=`${height}px`;
    shell.style.top=`${button.bottom+16}px`; shell.style.transform=`translateX(${left}px)`;
    shell.style.setProperty('--nav-tip-x',`${button.left+button.width/2-left}px`);
  }
  function open(item, focus = null) {
    if(current===item){if(focus)(focus==='last'?links(item).at(-1):links(item)[0])?.focus({preventScroll:true});return;}
    const previous=current;
    const travel=previous&&isDesktop(previous)&&isDesktop(item)&&!shell.hidden;
    clearTimeout(closingTimer); shell.classList.remove('is-closing');
    if(previous)deactivate(previous,travel);
    current=item; clearTimeout(item.timer);
    item.panel.hidden=false; item.panel.inert=false; item.panel.removeAttribute('aria-hidden');
    item.button.setAttribute('aria-expanded','true');item.wrapper.classList.add('is-open');
    if(isDesktop(item)){
      shell.hidden=false;
      position(item,!travel);
      revealTip(travel);
      if(!travel){
        shell.classList.remove('is-entering'); void shell.offsetWidth; shell.classList.add('is-entering');
      }else shell.classList.remove('is-entering');
      item.panel.dataset.active='false';
      void item.panel.offsetWidth;
      item.panel.dataset.active='true';
    }else{shell.hidden=true;item.panel.dataset.active='true';}
    if(focus)(focus==='last'?links(item).at(-1):links(item)[0])?.focus({preventScroll:true});
  }
  function onKey(item,event){
    if(event.key==='Escape'&&current===item){event.preventDefault();event.stopPropagation();close(true);return;}
    if(event.target===item.button){
      if(['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();open(item,event.key==='ArrowUp'?'last':'first');}
      else if(event.key==='Tab'&&!event.shiftKey&&current===item&&isDesktop(item)){event.preventDefault();links(item)[0]?.focus();}
      return;
    }
    if(current!==item||!item.panel.contains(event.target))return;
    const list=links(item);let index=list.indexOf(document.activeElement);
    if(event.key==='Tab'&&isDesktop(item)){
      if(event.shiftKey&&index===0){event.preventDefault();close(true);}
      else if(!event.shiftKey&&index===list.length-1){
        event.preventDefault();const group=items.filter(e=>!e.mobile),next=group[group.indexOf(item)+1];
        close();(next?.button||document.querySelector('#search-toggle'))?.focus();
      }
      return;
    }
    if(event.key==='ArrowDown')index=(index+1)%list.length;
    else if(event.key==='ArrowUp')index=(index-1+list.length)%list.length;
    else if(event.key==='Home')index=0;
    else if(event.key==='End')index=list.length-1;
    else return;
    event.preventDefault();list[index]?.focus();
  }
  for(const button of document.querySelectorAll('.nav-trigger[aria-controls]')){
    const panel=document.getElementById(button.getAttribute('aria-controls')),wrapper=button.closest('.nav-disclosure');
    if(!panel||!wrapper)continue;
    const item={button,panel,wrapper,mobile:!!wrapper.closest('#mobile-menu'),timer:0};items.push(item);
    if(!item.mobile){panel.classList.add('nav-shell-content');clip.append(panel);}
    hidePanel(item);button.setAttribute('aria-expanded','false');
    button.addEventListener('click',()=>{if(current===item)close();else open(item);});
    button.addEventListener('keydown',event=>onKey(item,event));
    panel.addEventListener('keydown',event=>onKey(item,event));
    panel.addEventListener('click',event=>{if(event.target.closest('a[href]'))close();});
  }
  function outside(target){return current&&!current.panel.contains(target)&&!current.wrapper.contains(target)&&!(nav&&nav.contains(target));}
  document.addEventListener('pointerdown',event=>{if(outside(event.target))close();});
  document.addEventListener('click',event=>{if(outside(event.target))close();});
  document.addEventListener('focusin',event=>{if(outside(event.target))close();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&current){event.preventDefault();close(true);}});
  desktop.addEventListener('change',()=>{close();shell.hidden=true;items.forEach(hidePanel);});
  reduced.addEventListener('change',()=>{if(reduced.matches){clearTimeout(tip.timer);targetTip(current?1:0,true);items.filter(item=>item!==current).forEach(hidePanel);if(!current)shell.hidden=true;}});
  addEventListener('resize',()=>{if(current&&isDesktop(current))position(current,true);},{passive:true});
  addEventListener('scroll',()=>{if(current&&isDesktop(current))close();},{passive:true});
  const mobile=document.querySelector('#mobile-menu');
  if(mobile)new MutationObserver(()=>{if(mobile.hidden&&current?.mobile)close();}).observe(mobile,{attributes:true,attributeFilter:['hidden']});
})();
