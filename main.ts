// Neon Coast Cover Studio — the entry program (Node 22, standard library only).
//
// It hands the app in: copies this repository's app/ (the offline cover maker:
// index.html, its ES modules, the Anton + Pacifico fonts under SIL OFL and the
// two sample photos drawn in code) and screenshots/ (the cover the app exported
// plus the editor at work) into /output, then writes /output/dossier.json with
// buildDossier from the vendored make.fun library — the summary the judge reads.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the app locally with `node serve.ts` (http://localhost:8080).

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The gate's caps (reference/gate.json): text_max_bytes shapes the dossier
// text; the rest refuse an entry the scorer would refuse — more than 4
// screenshots or one over 256 KiB, app/ over 993 files or 48 MiB, or a path
// under app/ over 1000 bytes. app/ + screenshots/ + dossier.json share
// /output's own 1000-entry / 64 MiB cap, so this entry stays far below all of them.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
