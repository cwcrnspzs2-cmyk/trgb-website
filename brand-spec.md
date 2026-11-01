# TRGB · brand-spec

Vastgelegde ontwerpbeslissingen en assets voor de nieuwe site. Alle HTML verwijst naar deze bestanden via `<img src>`, niets wordt nagetekend.

## Assets

| Asset | Bestand | Status |
|---|---|---|
| Clublogo | `assets/logo-trgb.png`, `assets/logo-trgb@3x.png` | Origineel, geknipt uit schermafbeelding (74 × 56 px). Scherp origineel nog aan te leveren. |
| Foto tennis | `assets/foto-tennis.jpg` | Van de huidige site, groene rand verwijderd |
| Foto padel | `assets/foto-padel.jpg` | Van de huidige site |
| Sponsorlogo's (14) | `assets/sponsors/*.png` | Geknipt uit de sponsorpagina. Carrosserie Jans is in de bron rechts afgesneden. |
| Mascottes | `partials/ace.svg`, `gravi.svg`, `pip.svg` | Eigen ontwerp, SVG |
| 3D-scène | `js/scene3d.js` (Three.js, lokaal in `js/vendor/`) | Tennis en padel, wisselbaar |

## Kleur

| Token | Licht | Donker | Gebruik |
|---|---|---|---|
| `--lime` | #C9D42B | #C9D42B | Primaire knop, accenten (uit het logo) |
| `--red` | #C8281F | #C8281F | Alleen het woord in de hero-kop (uit het logo) |
| `--green` | #0E3B2E | #DCE67A | Donkere vlakken, links |
| `--bg` | #FBF9F4 | #161C19 | Pagina |
| `--surface` | #FFFFFF | #1F2622 | Kaarten, formulieren |
| `--ink` | #1C2A24 | #F2F0EA | Tekst |
| `--muted` | #66706B | #A3ACA6 | Secundaire tekst (contrast ≥ 4.5:1) |
| `--line` | #E7E2D8 | #333D37 | Randen |

Eén accentkleur (lime) voor alle primaire acties op elke pagina. Geen achtergrondgradiënten.

## Typografie

- Koppen: Fredoka 600. Tekst: Nunito 600 tot 800. Geen 900, geen cursief.
- Schaal: 0.75 / 0.875 / 1 / 1.125 / 1.25 / 1.5 / 2.25 / 3.75 rem.
- Grote koppen: letterafstand −0.02em, regelhoogte 1.04. Tekst: 1.5. `text-wrap: balance` op koppen, `pretty` op alinea's.
- Hero-kop en -tekst max. 680 px breed.

## Spacing en vorm

- Afstanden: 4 / 8 / 12 / 16 / 24 / 32 / 40 / 48 / 64 / 80 / 96 px.
- Hoekradius: kaarten 16 px, kleine elementen 12 px, knoppen pil. Geneste radius = buiten − tussenruimte (sponsortegel in kaart: 8 px).
- Randen altijd rondom, 1 px. Schaduw alleen bij aanwijzen, via een pseudo-element (opacity).

## Beweging

- Easing: `cubic-bezier(.23,1,.32,1)` voor beweging, `ease` voor kleur, `linear` voor de sponsorband.
- Duur: 120 tot 200 ms voor UI, sponsorband 60 s, 3D-zweven traag.
- Alles onderbreekbaar (transities, geen keyframes op UI). Verminderde beweging: alleen opacity en kleur.
- Hover alleen bij `(hover:hover) and (pointer:fine)`.

## Pagina's

index · spelen · jeugd · lid-worden · kalender · club · privacy · 404
