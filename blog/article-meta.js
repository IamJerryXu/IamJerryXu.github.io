'use strict';
(() => {
  // This display never increments or fetches a counter. The site supplies a verified total.
  const digits = ['abcdef','bc','abged','abgcd','fgbc','afgcd','afgcde','abc','abcdefg','abcdfg'];
  const namespace = 'http://www.w3.org/2000/svg';
  let id = 0;
  const models = [];
  const zh = () => document.documentElement.lang.startsWith('zh');
  // tools.js owns the existing synthesized buffers, mute state and audio lifetime.
  const sound = kind => document.dispatchEvent(new CustomEvent('blog:counter-sound', {detail:{kind}}));
  function node(name, attributes = {}) {
    const element = document.createElementNS(namespace, name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    return element;
  }
  function total(slot) {
    const raw = slot.getAttribute('data-hits');
    if (raw === null || !/^\d+$/.test(raw)) return null;
    const value = Number(raw);
    return Number.isSafeInteger(value) && value >= 0 ? value : null;
  }
  function label(model) {
    if (!model.button) return;
    model.button.setAttribute('aria-label', zh()
      ? `页面访问次数：${model.value}。切换数码管灯光。`
      : `Retro-style hit counter, showing ${model.value} visits. Toggle the display light.`);
  }
  function build(model) {
    const {slot} = model, value = total(slot);
    if (value === model.value && model.rendered) { label(model); return; }
    model.cleanup?.();
    model.value = value; model.rendered = true; model.button = null;
    slot.replaceChildren();
    if (value === null) {
      const unknown = document.createElement('span');
      unknown.className = 'article-hit-unknown'; unknown.textContent = '—';
      unknown.setAttribute('aria-label', zh() ? '访问次数尚不可用' : 'Visit count unavailable');
      slot.append(unknown); return;
    }
    const text = String(value).padStart(6, '0'), width = text.length * 14 + 14;
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'article-hit-display';
    button.dataset.isOn = 'false'; button.setAttribute('aria-pressed', 'false');
    const svg = node('svg', {width, height:38, viewBox:`0 0 ${width} 38`, 'aria-hidden':'true', focusable:'false'});
    const uid = `hit-bevel-${++id}`, defs = node('defs');
    const stops = {
      outer:[[0,'#394e6f'],[.3,'#7695cc'],[.6,'#b5c8f0'],[.9,'#b5c4e1'],[1,'#98a9cb']],
      inner:[[0,'#394e6f'],[.15,'#546f8c'],[.5,'#b5c8f0'],[.8,'#c5d8f9'],[1,'#7991bc']]
    };
    const edges = [
      ['top','outer',[0,5,0,0],`M0 0 5 5 ${width-5} 5 ${width} 0Z`],
      ['left','outer',[5,0,0,0],'M0 0 5 5 5 33 0 38Z'],
      ['right','inner',[width,0,width-5,0],`M${width} 0 ${width-5} 5 ${width-5} 33 ${width} 38Z`],
      ['bottom','inner',[0,38,0,33],`M0 38 5 33 ${width-5} 33 ${width} 38Z`]
    ];
    const bevel = node('g', {class:'hit-counter-bevel'});
    edges.forEach(([name, style, coords, path]) => {
      const gradient = node('linearGradient', {id:`${uid}-${name}`, gradientUnits:'userSpaceOnUse',x1:coords[0],y1:coords[1],x2:coords[2],y2:coords[3]});
      stops[style].forEach(([offset,color]) => gradient.append(node('stop', {offset,'stop-color':color})));
      defs.append(gradient); bevel.append(node('path',{d:path,fill:`url(#${uid}-${name})`}));
    });
    svg.append(defs,node('rect',{class:'hit-counter-face',width,height:38}));
    svg.append(node('rect',{class:'hit-counter-glow',x:3,y:3,width:width-6,height:32}));
    svg.append(node('rect',{class:'hit-counter-face',x:5,y:5,width:width-10,height:28}));
    const segment = 'M.325 1 1.325 0 8.675 0 9.675 1 8.675 2 1.325 2Z';
    const positions = {a:'translate(1 0)',b:'translate(12 1) rotate(90)',c:'translate(12 11) rotate(90)',d:'translate(1 20)',e:'translate(2 11) rotate(90)',f:'translate(2 1) rotate(90)',g:'translate(1 10)'};
    [...text].forEach((digit, index) => {
      const group = node('g', {transform:`translate(${8 + index * 14} 8)`});
      Object.entries(positions).forEach(([key, transform]) => {
        group.append(node('path',{d:segment,transform,class:'hit-segment-background'}));
        group.append(node('path',{d:segment,transform,class:'hit-segment-active','data-lit':String(digits[Number(digit)].includes(key))}));
      });
      svg.append(group);
    });
    svg.append(bevel); button.append(svg); slot.append(button); model.button = button; label(model);
    const events = new AbortController();
    const options = {signal:events.signal};
    let held = false;
    const press = () => {
      if (held) return;
      held = true; sound('down');
    };
    const cancel = () => { if (held) { held = false; sound('stop'); } };
    button.addEventListener('pointerdown', event => { if (event.button === 0) press(); }, options);
    button.addEventListener('pointercancel', cancel, options);
    button.addEventListener('pointerleave', cancel, options);
    button.addEventListener('blur', cancel, options);
    button.addEventListener('keydown', event => {
      if (!['Enter', ' '].includes(event.key)) return;
      if (event.repeat) { event.preventDefault(); return; }
      press();
    }, options);
    window.addEventListener('pointerup', event => {
      if (!button.contains(event.target)) cancel();
    }, options);
    model.cleanup = () => { cancel(); events.abort(); };
    button.addEventListener('click', () => {
      held = false; sound('stop');
      const on = button.dataset.isOn !== 'true';
      button.dataset.isOn = String(on); button.setAttribute('aria-pressed', String(on));
      sound(on ? 'on' : 'off');
      // The light is an independent local toy; clicking it never changes the total.
      document.dispatchEvent(new CustomEvent('blog:counter-light', {detail:{on}}));
    }, options);
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const model = models.find(item => item.slot === entry.target);
      model.visible = true; build(model); observer.unobserve(entry.target);
    });
  }, {threshold:0});
  document.querySelectorAll('.article-hit-slot').forEach(slot => {
    const model = {slot, visible:false, rendered:false, value:null, button:null};
    models.push(model);
    // Unknown data is explicit even before lazy construction of the numeric display.
    if (total(slot) === null) build(model);
    observer.observe(slot);
    new MutationObserver(() => { if (model.visible || total(slot) === null) build(model); }).observe(slot, {attributes:true, attributeFilter:['data-hits']});
  });
  new MutationObserver(() => models.forEach(model => {
    if (model.value === null) { model.rendered = false; build(model); } else label(model);
  })).observe(document.documentElement, {attributes:true, attributeFilter:['lang']});
})();
