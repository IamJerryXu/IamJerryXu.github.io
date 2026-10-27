'use strict';
// Logic-level DOM harness; browser rendering is checked separately.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
const source = fs.readFileSync(require('node:path').join(__dirname, '../daily/daily.js'), 'utf8');
function setup(search = '') {
  const documentEvents = {}, windowEvents = {};
  let document;
  function el(dataset = {}) {
    const attrs = {}, events = {}, classes = new Set();
    const self = {dataset,events,hidden:false,inert:false,textContent:'',style:{},getBoundingClientRect:()=>({top:200,bottom:244}),
      setAttribute:(k,v)=>attrs[k]=v, getAttribute:k=>attrs[k], removeAttribute:k=>delete attrs[k],
      addEventListener:(k,fn)=>(events[k]??=[]).push(fn),
      emit:(k,event={})=>(events[k]||[]).forEach(fn=>fn({target:self,key:'',button:0,preventDefault(){},stopPropagation(){},...event})),
      classList:{add:v=>classes.add(v),remove:v=>classes.delete(v),contains:v=>classes.has(v)},
      focus:()=>document.activeElement=self};
    return self;
  }
  const links=['','2026-10-27','2026-10-26','2026-10-25'].map(date=>{
    const link=el({date});link.querySelector=()=>({dataset:{en:date||'All dates',zh:date||'全部日期'}});return link;
  });
  const button=el(),panel=el(),label=el(),filter=el(),count=el(),empty=el();
  panel.querySelectorAll=()=>links;panel.contains=node=>links.includes(node);
  filter.contains=node=>[filter,button,panel,...links].includes(node);
  const papers=[el(),el(),el()];
  const days=[{dataset:{date:'2026-10-27'},querySelectorAll:()=>papers.slice(0,2)},{dataset:{date:'2026-10-26'},querySelectorAll:()=>papers.slice(2)}];
  const location={href:'https://jerrysnow.me/daily/'+search,search};
  const history={entries:[],pushState:(_s,_t,url)=>{history.entries.push(url.href);location.href=url.href;location.search=url.search}};
  document={documentElement:{lang:'en'},activeElement:null,querySelector:selector=>({'#daily-filters':filter,'#daily-date-toggle':button,'#daily-date-panel':panel,'#daily-date-value':label,'[data-daily-count]':count,'#daily-no-results':empty})[selector],querySelectorAll:()=>days,addEventListener:(k,fn)=>documentEvents[k]=fn};
  const reduced={matches:false,addEventListener:()=>{}};
  vm.runInNewContext(source,{document,location,history,URL,URLSearchParams,innerHeight:800,matchMedia:()=>reduced,setTimeout:()=>1,clearTimeout(){},window:{addEventListener:(k,fn)=>windowEvents[k]=fn}});
  return {button,panel,label,filter,links,papers,days,count,empty,document,location,history,reduced,documentEvents,windowEvents};
}
test('progressive enhancement exposes button and closes date links',()=>{
 const s=setup();assert.equal(s.button.hidden,false);assert.equal(s.panel.hidden,true);assert.equal(s.count.textContent,'3');assert.equal(s.links[0].getAttribute('aria-current'),'true');
});
test('date selection, All dates and legacy tags preserve unrelated parameters',()=>{
 const s=setup('?tag=video-mllm&ref=shared');assert.equal(s.count.textContent,'3');
 s.links[2].emit('click');assert.equal(s.count.textContent,'1');assert.equal(s.location.search,'?ref=shared&date=2026-10-26');assert.equal(s.document.activeElement,s.button);
 s.links[0].emit('click');s.links[0].emit('click');assert.equal(s.count.textContent,'3');assert.equal(s.location.search,'?ref=shared');assert.equal(s.history.entries.length,2);
});
test('empty date is honest and recoverable',()=>{
 const s=setup();s.links[3].emit('click');assert.equal(s.count.textContent,'0');assert.equal(s.empty.hidden,false);assert.ok(s.days.every(d=>d.hidden));s.links[0].emit('click');assert.equal(s.empty.hidden,true);
});
test('Back/Forward and pageshow restore selection and translated label',()=>{
 const s=setup();s.location.search='?date=2026-10-27&tag=anything';s.windowEvents.popstate();assert.equal(s.count.textContent,'2');assert.equal(s.label.textContent,'2026-10-27');assert.equal(s.links[1].getAttribute('aria-current'),'true');
 s.document.documentElement.lang='zh-CN';s.location.search='';s.windowEvents.pageshow();assert.equal(s.count.textContent,'3');assert.equal(s.label.textContent,'全部日期');
});
test('invalid parameters do not hide records',()=>{
 const s=setup('?date=not-a-date&tag=%3Cscript%3E');assert.equal(s.count.textContent,'3');assert.equal(s.label.textContent,'All dates');
});
test('keyboard navigation and Escape restore focus',()=>{
 const s=setup();s.button.emit('keydown',{key:'ArrowDown'});assert.equal(s.button.getAttribute('aria-expanded'),'true');assert.equal(s.document.activeElement,s.links[0]);
 s.filter.emit('keydown',{key:'End',target:s.links[0]});assert.equal(s.document.activeElement,s.links[3]);
 s.filter.emit('keydown',{key:'ArrowDown',target:s.links[3]});assert.equal(s.document.activeElement,s.links[0]);
 s.filter.emit('keydown',{key:'Escape',target:s.links[0]});assert.equal(s.document.activeElement,s.button);assert.equal(s.panel.inert,true);assert.equal(s.button.getAttribute('aria-expanded'),'false');
});
test('outside pointer and focus close without trapping navigation',()=>{
 const s=setup();s.button.emit('click');s.documentEvents.pointerdown({target:{}});assert.equal(s.button.getAttribute('aria-expanded'),'false');
 s.button.emit('click');s.documentEvents.focusin({target:{}});assert.equal(s.button.getAttribute('aria-expanded'),'false');
});
test('reduced motion closes immediately and reopening clears closing state',()=>{
 const s=setup();s.reduced.matches=true;s.button.emit('click');s.button.emit('click');assert.equal(s.panel.hidden,true);s.button.emit('click');assert.equal(s.panel.hidden,false);assert.equal(s.panel.inert,false);assert.equal(s.panel.classList.contains('is-closing'),false);
});
test('modified clicks retain native link behavior',()=>{
 const s=setup();s.links[1].emit('click',{ctrlKey:true,preventDefault(){throw Error('must not intercept')}});assert.equal(s.history.entries.length,0);
});
test('empty archive is a safe no-op',()=>{
 vm.runInNewContext(source,{document:{querySelector:()=>null}});
});

test('menu opens upward when the trigger is near the viewport bottom',()=>{ const s=setup();s.button.getBoundingClientRect=()=>({top:700,bottom:744});s.button.emit('click');assert.equal(s.panel.dataset.placement,'above');assert.equal(s.panel.style.maxHeight,'320px'); });
