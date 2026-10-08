'use strict';
(() => {
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  document.querySelectorAll('.article-example').forEach(example => {
    const controls=example.querySelector('.demo-controls'), input=example.querySelector('input[type=range]');
    const button=example.querySelector('.demo-play'), phase=example.querySelector('.demo-phase');
    const panels=[...example.querySelectorAll('.example-panel')], group=example.querySelector('.example-panels');
    const actor=example.querySelector('.demo-tracker'), path=example.querySelector('.demo-path-base'), trace=example.querySelector('.demo-path-active');
    const length=path?.getTotalLength();
    let frame=0, playing=false, previous=0, value=0, current=-1;
    const chinese=()=>document.documentElement.lang.startsWith('zh');
    const updateButton=()=>{
      button.setAttribute('aria-label', reduced.matches ? (chinese()?'下一个时刻':'Next moment') : playing ? (chinese()?'暂停示意':'Pause example') : (chinese()?'播放示意':'Play example'));
      button.innerHTML='<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(playing?'<path d="M8 4v16M16 4v16"/>':'<path d="m7 4 14 8-14 8Z"/>')+'</svg>';
    };
    const draw=()=>{
      input.value=String(Math.round(value*1000));
      const index=example.dataset.demo==='memory' ? (value<.365?0:value<.635?1:2) : (value<.33?0:value<.67?1:2);
      if(index!==current){panels.forEach((panel,i)=>panel.hidden=i!==index);current=index;}
      const label=panels[index].dataset[chinese()?'labelZh':'labelEn'];
      phase.textContent=label; input.setAttribute('aria-valuetext',`${label}, ${Math.round(value*100)}%`);
      if(path){
        const point=path.getPointAtLength(length*value);
        actor.setAttribute('cx',point.x); actor.setAttribute('cy',point.y);
        const start=index===2?length*.5:0;
        trace.style.strokeDasharray=`${Math.max(0,length*value-start)} ${length*2}`;
        trace.style.strokeDashoffset=String(-start);
      } else actor.setAttribute('cx',30+value*540);
    };
    const stop=()=>{playing=false;cancelAnimationFrame(frame);frame=0;previous=0;updateButton();};
    const tick=now=>{
      if(!playing)return;
      if(previous)value=Math.min(1,value+Math.min(now-previous,64)/4800);
      previous=now;draw();
      if(value>=1)stop();else frame=requestAnimationFrame(tick);
    };
    button.addEventListener('click',()=>{
      if(reduced.matches){stop();value=value<.33?.5:value<.67?1:0;draw();return;}
      if(playing){stop();return;}
      if(value>=1)value=0;
      playing=true;previous=0;updateButton();frame=requestAnimationFrame(tick);
    });
    input.addEventListener('input',()=>{stop();value=Number(input.value)/1000;draw();});
    const measure=()=>{
      let height=0;
      panels.forEach(panel=>{const hidden=panel.hidden;panel.style.cssText='position:absolute;width:100%;visibility:hidden';panel.hidden=false;height=Math.max(height,panel.getBoundingClientRect().height);panel.hidden=hidden;panel.removeAttribute('style');});
      group.style.setProperty('--example-panel-height',Math.ceil(height)+'px');
    };
    let width=0;
    new ResizeObserver(entries=>{const next=entries[0].contentRect.width;if(next!==width){width=next;measure();}}).observe(group);
    new MutationObserver(()=>{draw();updateButton();measure();}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
    if(document.fonts)document.fonts.ready.then(measure);
    new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)stop();}).observe(example.querySelector('.demo-stage'));
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
    window.addEventListener('pagehide',stop);reduced.addEventListener('change',stop);
    controls.hidden=false;example.classList.add('is-enhanced');draw();updateButton();measure();
  });
})();
