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
| dist/nova.probability.zip | One playable ZIP, 4.37 MB |

Node.js 22+, pnpm 10; Poppler's pdftoppm is needed only for conversion. Run `pnpm install --frozen-lockfile`, then `pnpm build` and `pnpm preview`. To regenerate cropped artwork from the PDFs and prepared enhanced banner, run `pnpm convert` before building. Intermediate renders are cached in .cache/.

[Open in local Probability](http://localhost:3002/play/#template=http%3A%2F%2F127.0.0.1%3A45944%2Fcompact%2F). The preview server uses 127.0.0.1:45944; Probability must be running at localhost:3002. Importing the ZIP also works.

370 pieces: 90 cards (three decks of 30), 268 counters/planet tiles, four player boards, one map, one two-sided reference aid, one tracking board and five classic pip dice. Repeated counters share artwork. Fronts and backs follow the printed sheets. All positions use a 1 mm grid; card sizes are 63.5 × 95.25 mm.

The table is prepared for the introductory solo scenario with red as the player, six non-X civilian cards dealt, all decks and the planet pool shuffled, income/naval power/VP at zero, turn one and scenario end three. The home rich-terran planet and its colony are staged beside the hand: choose a central-region system and move that stack there, then distribute hidden planets to the other central systems as directed on rulebook page 19. Rules and bot decisions remain manual; the other components are available for the remaining scenarios. Rebuilding preserves the saved shuffle.

Native component art is predominantly 300 dpi (11.81 px/mm), within the requested 5% tolerance. One banner used twice was 286 × 239 dpi; that individual image was enhanced 2× with Real-CUGAN (models-se, noise -1) before rendering. No ESRGAN. PNG masters retain 12 px/mm; full-resolution runtime AVIFs preserve pixel dimensions. No added distance previews or material LOD are included for the printed pieces; the built-in classic die is unchanged. The publisher's VASSAL module has lower-resolution assets and was not used for artwork.

This full-resolution package is intentionally retained as a Probability limits test. It can show grey pieces and GPU-budget errors; these renderer limitations are not worked around.
