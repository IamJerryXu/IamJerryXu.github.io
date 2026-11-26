"""Shared name mark for the academic homepage and Blog."""
from html import escape


def render_identity(href="/blog/", label="Yongxue Xu — Blog", *, homepage=False):
    """The surrounding heading or Blog navigation supplies the typography."""
    classes = "identity identity--profile" if homepage else "identity"
    def ear(side):
        return (
            f'<svg class="profile-name-ear profile-name-ear--{side}" width="28" height="28" '
            'viewBox="0 0 28 28" fill="none" aria-hidden="true" focusable="false">'
            '<g class="profile-name-ear-lines">'
            '<path d="M26 23C17.5 23 7.2 16.5 3 4C8.4 8 14.2 9.8 20 8.5C15.1 12 15.7 15.2 22.4 15.1C18.7 18.3 21 21.6 26 23"/>'
            '<path d="M10.5 11.8C13.3 16 17 19 21.2 20.3"/>'
            '</g></svg>'
        ) if homepage else ''

    first = f'<span class="profile-name-edge profile-name-edge--left">{ear("left")}Yongx</span>' if homepage else '<span>Yongx</span>'
    last = f'<span class="profile-name-edge profile-name-edge--right">Xu{ear("right")}</span>' if homepage else '<span>Xu</span>'
    return (
        f'<a class="{classes}" href="{escape(href, quote=True)}" aria-label="{escape(label, quote=True)}">'
        f'{first}'
        '<span class="name-monogram"><span class="name-monogram-text">ue</span>'
        '<svg class="name-letter-u" width="16" height="14" viewBox="0 0 16 14" fill="none" aria-hidden="true" focusable="false">'
        '<path d="M3.1 2.5C2.7 4.6 2.1 7.4 2.8 9.2C3.4 10.9 5.5 11.4 7.1 10.1C9.1 8.5 9.8 4.9 10.6 2.1L9.7 9.4C9.6 10.8 10.6 11.5 12.3 10.5"/>'
        '</svg><svg class="name-letter-e" width="16" height="14" viewBox="0 0 16 14" fill="none" aria-hidden="true" focusable="false">'
        '<path d="M3.2 7.4C6.4 7.6 11.8 6.2 11.4 3.8C11 1.5 7.7 1.5 5.6 3.1C2.2 5.7 1.9 9.6 4.9 11.1C7 12.2 9.5 11.6 11.7 9.9"/>'
        f'</svg></span>{last}</a>'
    )
