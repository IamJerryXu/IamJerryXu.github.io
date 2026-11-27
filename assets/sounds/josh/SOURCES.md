# Sound sources

Audio files retrieved from https://www.joshwcomeau.com/sounds/ on 2026-11-28; filenames are preserved. Interaction timing and volumes were checked against the public source maps for IconSpeaker, IconColorMode, HitCounter, DesktopNavigation, CategoryPill, and ContentPreview/PoppingArrows.

Josh’s use-sound library is MIT licensed. This does not assign that license to these recordings. His use-sound article describes nearly all site sounds as originating from Freesound; per-file license mappings were not provided. Existing site credits link to Josh W. Comeau.

The homepage adapts those interaction sounds to its own controls; it does not claim that every homepage control exists on the reference site.

Playback uses the official Howler 2.2.4 distribution, the playback dependency declared by use-sound 5.0.0 (`howler: ^2.2.4`). The static site calls Howl directly rather than adding React solely for the use-sound hook. The original recordings, volumes, and press/release interruption rules are retained; homepage-specific event bindings remain adaptations.

- Distribution: https://cdn.jsdelivr.net/npm/howler@2.2.4/dist/howler.min.js
- Library license: https://cdn.jsdelivr.net/npm/howler@2.2.4/LICENSE.md
- Local distribution: `assets/vendor/howler.min.js`
- Local MIT notice: `assets/vendor/howler-LICENSE.txt`
- Dependency verification: https://cdn.jsdelivr.net/npm/use-sound@5.0.0/package.json

The Howler MIT license covers the playback library, not these recordings.

Character greetings and the mouse bite/chew sequence adapt the original `pop.mp3` and `glug-b.mp3` recordings alongside existing pop/plunger/rising sounds, with restrained volume and per-play pitch variation. These are site-specific character cues, not a claim about the original site’s characters.
