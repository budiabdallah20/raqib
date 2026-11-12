# RAQEEB public identity — Academy doors

**Direction:** a contemporary academic theater rendered as an architectural museum. The visitor enters through an illuminated academic gate, discovers framed tools, selects an intended role and reaches a quiet credential desk. The design uses restrained light planes and recessed surfaces; it avoids literal red curtains and animated spectacle over form usability.

## Composition

| Screen | Desktop | Mobile |
| --- | --- | --- |
| Opening | Split architectural doors with a centered gate emblem, warm seam light and calm status line | Same emblem and panels, reduced depth; exit within the first usable moment |
| Landing hero | Headline and one useful live preview inside a broad proscenium | Headline and primary action first, preview after |
| Galleries | Three-value preface, then framed feature exhibits with short benefits | One or two columns; no hidden hover-only information |
| Gateways | Three related arches: student/cyan, doctor/gold, admin/violet | Full-width sequential gateways |
| Auth | Atmospheric side panel and framed form | Form first; no scene before the first input |

## Token matrix

| Semantic token | Intent |
| --- | --- |
| `--theater-ink`, `--theater-panel`, `--theater-raised` | Three dark elevation levels |
| `--theater-ivory`, `--theater-muted` | Reading hierarchy |
| `--theater-brass` | Institutional edge and primary action |
| `--theater-cyan`, `--theater-violet` | Limited role and interactive accents |
| `--theater-focus` | Visible keyboard focus |
| `--theater-ease`, `--theater-hover-ms`, `--theater-reveal-ms` | Consistent motion |

Frame anatomy: a one-pixel brass outer line, recessed dark surface, hairline inner border, one directional highlight, and generous content padding. Hover/focus strengthen the existing edge; mobile keeps a static edge. A small upper-left warm key light is balanced by a weak cool rim. Avoid multiple full-screen blur layers.

Typography: existing licensed/web-served Cairo for Arabic and Inter/Space Grotesk for Latin. Arabic headlines reveal as whole lines, without per-letter animation. Lucide icons use consistent stroke weight. The new SVG gate mark is designed for both a small icon and a larger opening seal; the existing product mark remains available to private portals until Phase 02 decisions.

Motion timeline: first paint shows a usable static shell; door panels part after observable initialization or the short first-visit introduction. The opening is interruptible, skipped on reduced motion and never blocks indefinitely. Section reveals use opacity and a small translation, with no scroll locking or parallax on touch.
