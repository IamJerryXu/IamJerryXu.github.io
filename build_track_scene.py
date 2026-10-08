from build_research_character import snow_character

def render_track_scene(block, tr):
    return f'''<section class="research-scene track-scene" aria-label="{block['title_en']}">
<p class="scene-instruction">{tr('Two questions. Keep an eye on who “his” refers to.','两个问题，留意第二问里的“他”指向谁。')}</p>
<div class="track-conversation">
<div class="track-identity"><div class="track-character" data-mood="curious">{snow_character(block['id']+'-player')}</div><span class="track-id">{tr('Player','球员')} <strong>#6</strong></span><span class="track-identity-note">{tr('same target','同一个目标')}</span></div>
<ol class="track-questions"><li><button type="button" disabled class="track-question is-selected" data-turn="0" aria-pressed="true"><span class="track-question-number">01</span><span>{tr('Who scored the three-pointer at 0.8 s?','谁在 0.8 秒时投中了三分球？')}</span></button></li><li><button type="button" disabled class="track-question" data-turn="1" aria-pressed="false"><span class="track-question-number">02</span><span>{tr('Show <em>his</em> trajectory from 0.5 s to 1.2 s.','画出<em>他</em>从 0.5 秒到 1.2 秒的轨迹。')}</span></button></li></ol>
</div>
<div class="track-request" aria-hidden="true"><div class="track-request-heading"><span class="track-request-label" data-en="Event time" data-zh="事件时刻">Event time</span><span class="track-request-value">0.8 s</span></div><div class="track-time-line"><div class="track-time-window"></div><span class="track-time-pin"></span><span class="track-time-start">0.5 s</span><span class="track-time-end">1.2 s</span></div></div>
<div class="track-explanation" aria-live="polite"><p data-turn-note="0">{tr('The first question picks out player #6 at a particular moment.','第一问用一个具体时刻，确定了图中的 6 号球员。')}</p><p data-turn-note="1" hidden>{tr('The follow-up still refers to #6. What changes is the requested interval: 0.5–1.2 s. The target should carry over from the first answer.','追问中的“他”仍然是 6 号球员。变化的是要看的时间范围：0.5–1.2 秒。目标身份需要从上一轮保留下来。')}</p></div>
<p class="scene-caption">{tr('Adapted from the two questions in Figure 1. The character stands for the player’s identity.','根据论文图 1 的两轮问答改画；小雪团代指球员身份。')}</p>
</section>'''
