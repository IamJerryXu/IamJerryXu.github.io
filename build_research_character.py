import html

def snow_character(key):
    key = html.escape(key, quote=True)
    return f'''<svg class="snow-character" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
<defs>
<radialGradient id="{key}-body" cx="30%" cy="18%" r="85%"><stop class="snow-light" offset="0" stop-color="#fffef8"/><stop class="snow-mid" offset=".58" stop-color="#f2f2ed"/><stop class="snow-shade" offset="1" stop-color="#bdc6de"/></radialGradient>
<linearGradient id="{key}-scarf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffeaa0"/><stop offset=".5" stop-color="#eec65e"/><stop offset="1" stop-color="#cb9944"/></linearGradient>
<filter id="{key}-blur" x="-50%" y="-100%" width="200%" height="300%"><feGaussianBlur stdDeviation="2.2"/></filter>
</defs>
<ellipse class="snow-shadow" cx="61" cy="107" rx="31" ry="5" fill="#484079" opacity=".17" filter="url(#{key}-blur)"/>
<g class="snow-core">
<path class="snow-foot" d="M33 94Q29 104 41 105Q51 105 51 95M69 95Q70 106 82 104Q90 102 85 94" fill="#d5ad62"/>
<path class="snow-body" d="M28 89C17 81 18 65 23 53C26 42 32 36 38 33C38 24 46 19 52 23C57 15 68 19 71 26C82 24 91 34 94 46C101 53 104 67 99 79C97 91 83 100 63 101C48 102 36 98 28 89Z" fill="url(#{key}-body)" stroke="#8897b3" stroke-opacity=".18" stroke-width="1.1"/>
<path class="snow-highlight" d="M29 51C33 39 42 35 47 36M44 29Q48 26 51 28" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" opacity=".75"/>
<path class="snow-scarf-tail" d="M77 84Q88 87 84 104L74 101Q80 91 73 89" fill="url(#{key}-scarf)"/>
<path d="M27 81Q59 95 94 80L93 89Q61 105 29 91Z" fill="url(#{key}-scarf)"/>
<path d="M30 83Q60 96 92 83" fill="none" stroke="#fff1b5" stroke-width="1.6" opacity=".8"/>
<g class="snow-look">
<g class="snow-eyes"><ellipse cx="43" cy="57" rx="3.6" ry="4.8" fill="#323746"/><ellipse cx="77" cy="57" rx="3.6" ry="4.8" fill="#323746"/><circle cx="42" cy="55.5" r="1" fill="white"/><circle cx="76" cy="55.5" r="1" fill="white"/></g>
<g class="snow-happy-eyes" fill="none" stroke="#323746" stroke-width="2.7" stroke-linecap="round"><path d="M39 57Q43 51 47 57M73 57Q77 51 81 57"/></g>
<g fill="#e7a1a1" opacity=".5"><ellipse cx="35" cy="65" rx="5.5" ry="2.8"/><ellipse cx="85" cy="65" rx="5.5" ry="2.8"/></g>
<path class="snow-mouth" d="M55 65Q60 72 65 65" fill="none" stroke="#46404a" stroke-width="2.5" stroke-linecap="round"/>
<ellipse class="snow-surprise" cx="60" cy="67" rx="3" ry="4" fill="#46404a"/>
</g></g></svg>'''
