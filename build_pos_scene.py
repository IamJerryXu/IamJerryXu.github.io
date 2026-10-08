"""An explicitly illustrative object-memory scene; no inference or fabricated output."""
from build_research_character import snow_character


def render_pos_scene(block, tr):
    key = block['id']
    cloud = f'''<svg class="pos-cloud" viewBox="0 0 320 200" aria-hidden="true"><defs><linearGradient id="{key}-cloud" x1="0" y1="0" x2=".7" y2="1"><stop class="pos-cloud-top"/><stop offset="1" class="pos-cloud-bottom"/></linearGradient></defs><path class="pos-cloud-shadow" d="M25 156C7 141 15 112 44 105C41 70 70 50 105 61C111 22 166 12 191 49C229 26 263 52 264 81C313 79 330 120 302 148C305 174 273 187 246 180C208 197 187 179 166 187C135 199 119 181 94 186C58 192 35 179 25 156Z"/><path fill="url(#{key}-cloud)" d="M21 144C3 129 11 100 40 93C37 58 66 38 101 49C107 10 162 0 187 37C225 14 259 40 260 69C309 67 326 108 298 136C301 162 269 175 242 168C204 185 183 167 162 175C131 187 115 169 90 174C54 180 31 167 21 144Z"/><path class="pos-cloud-glint" d="M54 86C53 66 74 51 92 60M113 45C122 20 153 18 172 37"/></svg>'''
    return f'''<section class="pos-scene research-scene" data-pos-scene data-state="visible" aria-label="Object memory illustration">
<div class="pos-scene-kicker"><span>{tr('What we can see','当前画面')}</span><span class="pos-scene-context">{tr('A concept illustration','概念示意')}</span></div>
<div class="pos-world">
<div class="pos-air" aria-hidden="true"></div>
<div class="pos-actor-position"><button class="pos-actor" type="button" role="slider" tabindex="-1" aria-label="Move the character" aria-valuemin="0" aria-valuemax="100" aria-valuenow="12" aria-orientation="horizontal" disabled><span class="pos-actor-pose">{snow_character(key+'-actor')}</span></button></div>
{cloud}
<span class="pos-drag-hint">{tr('Drag me through the cloud','拖动我，穿过这朵云')}</span>
</div>
<div class="pos-memory">
<div class="pos-memory-portrait" aria-hidden="true">{snow_character(key+'-memory')}<span class="pos-memory-dot"></span></div>
<div class="pos-memory-copy"><span class="pos-memory-label">{tr('The state we keep','保留的目标状态')}</span><span class="pos-memory-line">{tr('The last verified record stays here.','上一次核验通过的记录，留在这里。')}</span></div>
<span class="pos-memory-spark" aria-hidden="true">✦</span>
</div>
<div class="pos-scene-controls" hidden><button type="button" class="pos-next scene-press"><span>{tr('Into the cloud','走到云后')}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-5 5 5-5 5"/></svg></button><button type="button" class="pos-verify" disabled>{tr('Show a verified update','查看核验后的一种更新')}</button></div>
<p class="pos-scene-caption" aria-live="polite">{tr('The character can leave the picture without erasing the state kept below. When it comes back, a possible match still needs verification before it can change that record.','角色可以离开画面，而下方保留的状态并不会因此被抹掉。重新出现时，候选匹配仍须经过核验，才能改写这份记录。')}</p>
</section>'''
