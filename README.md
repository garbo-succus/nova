# Nova for Probability

Source: [Nova — Conflict in the Last Frontier](https://printandplay.games/nova-2/). [English rules](sources/pnp/Rules_Nova.pdf), [licence and credits](LICENSE.md).

| Path | Contents |
| --- | --- |
| sources/pnp/ | Unchanged publisher PDFs |
| sources/assets/ | Cropped 12 px/mm PNG masters |
| sources/assets.json | Physical sizes, quantities, crop locations and paired backs |
| sources/game.json | Saved layout and shuffled card order |
| sources/enhanced/ | Real-CUGAN reference-banner image, the only undersized embedded component image |
| scripts/ | JavaScript converter, build and preview tools |
| release/ | Deduplicated playable output |
| dist/nova.probability.zip | One playable ZIP, 4.38 MB |

Node.js 22+, pnpm 10; Poppler's pdftoppm is needed only for conversion. Run `pnpm install --frozen-lockfile`, then `pnpm build` and `pnpm preview`. To regenerate cropped artwork from the PDFs and prepared enhanced banner, run `pnpm convert` before building. Intermediate renders are cached in .cache/.

[Open in local Probability](http://localhost:3003/play/#template=http%3A%2F%2F127.0.0.1%3A45944%2Fcompact%2F). The preview server uses 127.0.0.1:45944; Probability must be running at localhost:3003. Importing the ZIP also works.

370 original game pieces plus three additional reference sheets and one fake private-area mat (374 total): 90 cards (three decks of 30), 268 counters/planet tiles, four player boards, one map, one two-sided reference aid, one tracking board and five classic pip dice. Repeated counters share artwork. Fronts and backs follow the printed sheets. All positions use a 1 mm grid; card sizes are 63.5 × 95.25 mm.

The table is staged for Colonization (3–4 players, rules §18.6): four player kits grouped on identical copies of the printed reference sheet, income/naval power/VP at zero, turn zero and end six. The three complete decks and all 44 planet tiles are shuffled. Players randomize turn order, choose peripheral regions and traits, place starting outposts and unexplored planets, draw six non-X cards following their trait restrictions, and take three rounds of 10-point starting purchases. Hands are deliberately undealt until those choices are made. For three players, set aside the unused colour kit. Run `pnpm setup:game` to reset and reshuffle; ordinary `pnpm build` preserves the saved layout.

Native component art is predominantly 300 dpi (11.81 px/mm), within the requested 5% tolerance. One banner used twice was 286 × 239 dpi; that individual image was enhanced 2× with Real-CUGAN (models-se, noise -1) before rendering. No ESRGAN. PNG masters retain 12 px/mm; full-resolution runtime AVIFs preserve pixel dimensions. No added distance previews or material LOD are included for the printed pieces; the built-in classic die is unchanged. The publisher's VASSAL module has lower-resolution assets and was not used for artwork.

This full-resolution package is intentionally retained as a Probability limits test. It can show grey pieces and GPU-budget errors; these renderer limitations are not worked around.

The fake private play area is the exact 400 × 400 × 4 mm model from the published Settlers game, including its original SVG texture and materials. It is a public visual placeholder, not an access-control boundary. Each player kit rests on an identical, original-size copy of the printed reference sheet (260.35 × 133.35 mm), keeping it movable as a group. All four copies share the same model and front/back textures. Players configure actual privacy in Probability. Its source model, geometry and SVG are retained in `sources/private-play-area/`.
