'use strict';
// Logic-level DOM harness; these tests do not claim visual/browser coverage.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
const source = fs.readFileSync(require('node:path').join(__dirname, '../daily/daily.js'), 'utf8');
function setup(search = '') {
  const events = {}, windowEvents = {};
  const control = (name, values) => ({name, value: '', options:values.map(value=>({value}))});
  const date = control('date', ['', '2026-10-27', '2026-10-26']);
  const tag = control('tag', ['', 'video-mllm', 'vla-world-model']);
  const papers = [{dataset:{tags:'video-mllm'}, hidden:false},{dataset:{tags:'vla-world-model video-mllm'}, hidden:false},{dataset:{tags:'vla-world-model'}, hidden:false}];
  const days = [{dataset:{date:'2026-10-27'},querySelectorAll:()=>papers.slice(0,2)},{dataset:{date:'2026-10-26'},querySelectorAll:()=>papers.slice(2)}];
  const form = {hidden:true, querySelector:selector=>selector.includes('date')?date:tag, addEventListener:(name, fn)=>events[name]=fn};
  const count = {textContent:'3'}, empty = {hidden:true};
  const location = {href:'https://jerrysnow.me/daily/'+search, search};
  const history = {entries:[],pushState:(_state,_title,url)=>{history.entries.push(url.href);location.href=url.href;location.search=url.search}};
  const document = {querySelector:selector=>({'#daily-filters':form,'[data-daily-count]':count,'#daily-no-results':empty})[selector],querySelectorAll:()=>days};
  vm.runInNewContext(source,{document,location,history,URL,URLSearchParams,window:{addEventListener:(name,fn)=>windowEvents[name]=fn}});
  return {date,tag,papers,days,form,count,empty,location,history,events,windowEvents};
}
test('progressive enhancement shows controls and all papers',()=>{
 const s=setup(); assert.equal(s.form.hidden,false);assert.equal(s.count.textContent,'3');assert.equal(s.empty.hidden,true);
});
test('date and topic form an intersection with honest empty state',()=>{
 const s=setup();s.date.value='2026-10-26';s.tag.value='video-mllm';s.events.change();
 assert.equal(s.count.textContent,'0');assert.equal(s.empty.hidden,false);assert.ok(s.papers.every(paper=>paper.hidden));
 assert.ok(s.location.search.includes('date=2026-10-26'));assert.ok(s.location.search.includes('tag=video-mllm'));
});
test('reset is repeatable and removes only filter query parameters',()=>{
 const s=setup('?tag=video-mllm&ref=shared');assert.equal(s.count.textContent,'2');
 s.events.reset({preventDefault(){}});s.events.reset({preventDefault(){}});
 assert.equal(s.count.textContent,'3');assert.equal(s.location.search,'?ref=shared');assert.equal(s.history.entries.length,1);
});
test('Back/Forward and pageshow restore URL filters',()=>{
 const s=setup();s.location.search='?date=2026-10-27&tag=vla-world-model';s.windowEvents.popstate();
 assert.equal(s.date.value,'2026-10-27');assert.equal(s.tag.value,'vla-world-model');assert.equal(s.count.textContent,'1');
 s.location.search='';s.windowEvents.pageshow();assert.equal(s.count.textContent,'3');
});
test('invalid parameters do not hide all records',()=>{
 const s=setup('?date=not-a-date&tag=%3Cscript%3E');assert.equal(s.date.value,'');assert.equal(s.tag.value,'');assert.equal(s.count.textContent,'3');
});
test('empty archive is a safe no-op',()=>{
 vm.runInNewContext(source,{document:{querySelector:()=>null}});
});
