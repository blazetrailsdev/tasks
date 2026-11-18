---
rfc: "0247-website-refresh"
title: "Website refresh: remove Frontiers, deploy to GitHub Pages, landing page and docs for 54 packages"
status: draft
created: 2026-11-18
updated: 2026-11-18
owner: "@deanmarano"
packages:
  - "website"
clusters:
  - website-deploy
  - website-docs
  - website-landing
---

# RFC 0247 — Website refresh: remove Frontiers, deploy to GitHub Pages, landing page and docs for 54 packages

## Summary

`packages/website` was written when activerecord was under half ported and the
workspace had six user-facing packages. trails now has 55 workspace packages (one of them the website),
54 of them published. The site documents six packages, does not build, and is
not deployed anywhere. This RFC does four things, in order:

1. It deletes the Frontiers tutorial and sandbox, the code that breaks the build.
2. It ships the trimmed site to GitHub Pages from `main`, so a live URL exists
   early.
3. It rebuilds the docs for every published package: generated TypeDoc,
   per-package deviation pages, live parity numbers, and a guides index
   that follows the Rails Guides table of contents.
4. It rebuilds the landing page on the structure of rubyonrails.org, with
   trails' own art, copy and walkthrough.

## Motivation

### What exists today (verified 2026-11-18 at trails `ed7746008b`)

| Piece          | Where                                                                  | State                                                                                                                                                                                                                                                                                                                                              |
| -------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SvelteKit app  | `packages/website/src/routes/`, `svelte.config.js:1-14`                | `adapter-static` with `fallback: "index.html"` (`svelte.config.js:7`) and no `paths.base`. Routes: `/` (`+page.svelte`, 459 lines), `frontiers/learn/**`, `dev/filetree`, `dev/monaco`.                                                                                                                                                            |
| Frontiers      | `src/lib/frontiers/**`, `src/routes/frontiers/**`, `src/routes/dev/**` | 9,395 lines across 73 `src/` files: sandbox, VFS, sql.js driver, tutorial engine, 22 Svelte components, tests.                                                                                                                                                                                                                                     |
| Service worker | `vite.sw.config.ts:1-112`, entry `src/lib/frontiers/sandbox-sw.ts`     | Exists only for the sandbox: an IIFE that runs `importScripts("/sql-wasm.js")` (`vite.sw.config.ts:20`) with a second, hand-kept alias table (`:31-72`). `predev` and `build` both run `build:sw` first (`package.json:7,10`).                                                                                                                     |
| VitePress docs | `packages/website/docs/`, `docs/.vitepress/config.ts:1-75`             | `base: "/docs/"`, `outDir: "../build/docs"`, local search with `api/**` excluded from the index (`:58-71`). The nav "Website" link defaults to `https://frontiers.deanoftech.com` (`:3`).                                                                                                                                                          |
| TypeDoc        | `packages/website/typedoc.config.mjs:12-19`                            | Hard-coded to six packages: arel, activemodel, activerecord, activesupport, rack, actionpack. Declares only `@missingRailsCall` / `@noRailsEquivalent` as known tags (`:7`).                                                                                                                                                                       |
| Guides         | `docs/guides/`                                                         | `index.md` (195 lines), `idioms.md` (283), and three deviation pages: arel (135), activemodel (145), activerecord (509).                                                                                                                                                                                                                           |
| Landing page   | `src/routes/+page.svelte`                                              | Full-bleed SVG forest hero, a "Rails to Trails" command table, a code sample, and a six-package grid with hard-coded coverage numbers (`:3-8`).                                                                                                                                                                                                    |
| Deploy         | `.github/workflows/`                                                   | **None.** The directory holds only `ci.yml` and `perf.yml`, and neither has a Pages, `deploy-pages` or `upload-pages-artifact` step.                                                                                                                                                                                                               |
| PR check       | `.github/workflows/ci.yml:2124-2160`                                   | A `Website` job exists, gated on `website_affected` (`WEBSITE_PKGS_RE='^packages/website/'`, `:148`) or a `website` / `release` label. It is **disabled** with `false &&` at `:2134`, "until the build passes".                                                                                                                                    |
| Docs license   | `LICENSE-docs`, `LICENSES.md:9-51`                                     | Guide prose is CC BY 4.0. `LICENSES.md:46-51` forbids copying from Rails Guides (CC BY-SA 4.0, `vendor/rails/v8.0.2/guides/source/_license.html.erb:1`) and allows the topic list and section order as structural reference. It points at `docs/rails-guides-migration-plan.md`, which does not exist in the tree or in git history (broken link). |

### What is broken

Each step was run locally on 2026-11-18:

- `pnpm run build:sw` fails with `Rollup failed to resolve import
"@blazetrails/ruby-compat/psych-adapter" from …/src/lib/frontiers/sandbox-sw.ts`.
- `vite build` fails with the same unresolved import, from
  `src/lib/frontiers/runtime.ts`.
- `docs:build` fails in `docs:typedoc`. TypeDoc runs on the `typescript-5`
  (5.9) toolchain and reports 11 errors (`Failed to convert one or more
packages`): `Relation<…, false>` against `Relation<…, boolean>` in
  `activerecord/lib/relation.ts:846,1014,1032,1404` and
  `querying.ts:971,978`, `abstract-adapter.ts:508`, and
  `strong-parameters.ts:183,636`. It also logs 162 `unknown block tag`
  warnings for receipt tags it was never told about (`@inventedArm`,
  `@inlinedFrom`, `@perf`, `@missingRailsName`, …). This is the open story
  `website-docs-typedoc-fails-under-ts5` (RFC 0061).
- Nine Frontiers tests are red on `main`, and no CI job runs them
  (`website-frontiers-nine-tests-red-on-main`).

Both SvelteKit failures are in Frontiers code, so deleting Frontiers fixes
them. The TypeDoc failure is independent of Frontiers.

### Stale or missing, per package

The site's unit is the package, so the audit is too. "Landing" is the grid in
`+page.svelte:3-8`, "API" is `typedoc.config.mjs:12-19`, and "Deviations" is
`docs/guides/*-rails-deviations.md`.

**activerecord.**

- Landing: stale. Coverage is hard-coded at "71%", and the code sample uses
  `static { this.attribute(…) }`, where models now reflect their columns from
  the schema (`packages/activerecord/README.md:91`, `declare` pattern at
  `:246-262`).
- API: present, but it fails to build (TS 5.9 errors in `relation.ts`,
  `querying.ts`, `abstract-adapter.ts`).
- Deviations: stale.
  - § 5 documents `wrapWithScopeProxy` (`activerecord-rails-deviations.md:204-215,494`),
    which no longer exists in `packages/activerecord/lib`.
  - "Pluggable adapters for browser support" (`:499`) and the `static {}`
    model (`:423-426`) predate the current rules.
  - It cites none of the ratified sections in `packages/activerecord/CLAUDE.md`.

**activemodel.**

- Landing: stale ("95%").
- API: present.
- Deviations: partly stale. The `static {}` example (`:77`) needs updating,
  and the page does not cite § "Generated attribute readers are properties"
  or the serialization section in `packages/activemodel/CLAUDE.md`.

**arel.**

- Landing: stale ("100%").
- API: present.
- Deviations: present, but it does not cite
  `packages/arel/CLAUDE.md` § "Call-time constant resolution (arel)".

**activesupport, rack.**

- Landing: stale ("38%", "100%").
- API: present.
- Deviations: missing.

**actionpack.**

- Landing: stale ("27%", with the description "Controllers (74% API)").
- API: present, but it fails to build (`strong-parameters.ts:183,636`).
- Deviations: missing, though `packages/actionpack/CLAUDE.md` has eight
  ratified sections.

**actionview, actioncable, actionmailer, actionmailbox, actiontext, activejob,
activestorage, trailties.** These are the Rails frameworks a Rails dev looks
for first. They are missing from the landing grid, the API and the
deviations. Each has a `packages/<pkg>/CLAUDE.md`, which
`scripts/parity/package-summary.ts` already parses (`claudeSections`).

**ruby-compat.** Missing everywhere, although it is the package every
deviation page leans on (`rbFSend`, `include()`, `Hash`).

**solid-queue, solid-cache, solid-cable, turbo, stimulus, vite-assets,
vite-trails.** These are the Rails 8 defaults, and they are missing
everywhere. The Vite ruling (root `CLAUDE.md`, § "importmap-rails and
propshaft are out of scope") is the deviation a new user meets first.

**The other 28 gem ports and 4 tooling packages.** The gem ports are bcrypt,
builder, chronic, date, did-you-mean, et-orbi, fugit, globalid,
html-sanitizer, i18n, image-processing, mail, marcel, mini-magick, mini-mime,
msgpack, net-smtp, nokogiri, raabro, rack-cors, rack-proxy, rack-session,
rack-test, rackup, rake, thor, tzinfo and zeitwerk. The tooling packages are
activerecord-cli, trails-tsc, tse-compiler and vitest-matchers. All are
missing from the landing grid and the API.

Fourteen of these have no `lib/index.ts`: builder, chronic, et-orbi, fugit,
image-processing, marcel, mini-magick, mini-mime, net-smtp, raabro, rake,
thor, turbo and zeitwerk. TypeDoc's `packageOptions.entryPoints:
["lib/index.ts"]` (`typedoc.config.mjs:33`) cannot reach them; their entry is
the `"."` export.

Site-wide staleness:

- The GitHub links point at `blazetrailsdev/blazetrails` (`+page.svelte:58,359,454`).
  The repo is `blazetrailsdev/trails`, so these work only through GitHub's
  rename redirect.
- `docs/index.md`'s hero says "Rails API for TypeScript" and lists the same
  six packages.
- There are no parity numbers from any generated output. Every figure on the
  site was typed by hand.

### Prior art in the backlog, absorbed or referenced

Searched 2026-11-18 by grepping `rfcs/**/stories` for `packages/website`,
`vitepress`, `typedoc`, `GitHub Pages`, `frontiers` and `Rails Guides`
(82 files), then joining against the DB for open rows.

**Made obsolete by Frontiers removal.** These are closed by
`website-remove-frontiers` with `FALSIFIED:` (the code they fix no longer
exists), and the closing PR names each one:

- `website-frontiers-nine-tests-red-on-main` (RFC 0142)
- `website-vfs-generators-cannot-load-module-templates` (0142)
- `website-frontiers-generate-model-bypasses-hook-chain` (0142)
- `vfs-unlink-reports-enoent-for-bundled-template` (0154)
- `vfs-adapter-rmsync-noop-and-no-links` (0154)
- `sql-js-connection-rollback-has-no-test` (0187)
- `sqlite3-website-sql-js-engine` (0187). The sql.js engine it ports goes away
  with the sandbox. RFC 0187's other stories do not depend on a website
  consumer.

The 0051 Frontiers stories (`frontiers-sql-js-adapter-has-no-connection-pool`,
`website-frontiers-sandbox-still-scaffolds-db-migrations`,
`frontiers-db-migrate-still-blocked-on-eval-context`,
`website-frontiers-runtime-dbmigrate-and-sandbox-sw-tests-red`,
`website-src-tests-run-in-no-ci-job`, `browser-cli-reintroduces-the-retired-hyphen-filename-alias`)
are already `done` or `closed`. No action is needed.

**Referenced as deps, not duplicated:**

- `website-docs-typedoc-fails-under-ts5` (RFC 0061, draft). Its acceptance
  criteria are "`build` passes end to end" and "remove the `false &&`", and
  that is exactly the PR build check this RFC needs. The deploy story depends
  on it.
- `website-typedoc-backslash-angle-double-escaped` (0127, draft). It is a
  rendering bug in `scripts/escape-typedoc.mjs`. The all-packages TypeDoc
  story depends on it, so the bug is not multiplied across 54 packages.
- `website-is-outside-pnpm-typecheck` (0127, draft) and
  `website-eslint-ignore-generated-svelte-kit` (0025, ready). These are
  website hygiene and stay where they are.
- `make-new-package-registration-self-maintaining` (0025, draft). Its website
  half is the three hand-kept alias tables. Frontiers removal deletes one of
  them (`vite.sw.config.ts`). The TypeDoc story generates its entry list, so
  TypeDoc is not a fourth table.

RFC 0011 (`activerecord-docs-cutover`) is closed. It froze `docs/activerecord/`
in the repo root and never touched `packages/website`, so nothing carries
over.

## Design

### 1. Remove Frontiers (`website-remove-frontiers`)

Delete `src/lib/frontiers/**` and `src/routes/frontiers/**`. Also delete
`src/routes/dev/**`, since both pages import only Frontiers code
(`dev/filetree/+page.svelte:3-7`, `dev/monaco/+page.svelte:2-3`).

Delete the service worker: `vite.sw.config.ts`, the `build:sw` and `predev`
scripts, and `build:sw` in `build`. Its only entry is `sandbox-sw.ts`.

Delete the dependencies only Frontiers imports, each verified by grep over
`src/`, `scripts/`, `docs/` and the configs:

- `monaco-editor` (`MonacoEditor.svelte` only)
- `sql.js` (Frontiers, `dev/filetree`, `vitest.config.ts:15,33`)
- `mermaid` (`tutorials/diagram-renderer.ts` only)
- `dompurify` (`DiagramBlock.svelte` only)
- `yaml` (`runtime.ts`, `sandbox-sw.ts` only)

Then do the same for `@testing-library/svelte`, `@testing-library/jest-dom`
and `jsdom` if no test remains that needs them: `vitest.config.ts:38`'s
component project includes only `src/lib/frontiers/components/**`.

Strip the Frontiers aliases from `vitest.config.ts` (`$frontiers`, `:12`, and
the component project). Remove the `nokogiri-stub` if the SW config was its
only user. The CI `Website` job runs `build:sw`
(`ci.yml:2158`), so drop that from the step.

A Frontiers-free site has no service worker. Goal 1's scope requirement is
then met by having no worker. If a worker returns, it registers at
`` `${base}/` `` (see § 2).

### 2. GitHub Pages deployment (`website-pages-deploy-workflow`)

The workflow is `.github/workflows/pages.yml`, `on: push: branches: [main]`
plus `workflow_dispatch` and a daily `schedule` (so parity figures refresh
without a site change), and the push trigger is path-filtered (the exact list is
`website-pages-deploy-workflow`'s first criterion: the website, package
sources and manifests, and the README Quickstart the site reads). Parity
figures are a CI artifact, not a path, and refresh on the schedule. It has two jobs:

- `build` runs `pnpm install --frozen-lockfile`, then `pnpm build` (TypeDoc
  needs the workspace `.d.ts`), then `pnpm --filter @blazetrails/website build`,
  then `actions/upload-pages-artifact` from `packages/website/build`.
- `deploy` uses `environment: github-pages`, `permissions: pages: write,
id-token: write`, `concurrency: { group: pages, cancel-in-progress: false }`,
  and runs `actions/deploy-pages`.

The project URL is `https://blazetrailsdev.github.io/trails/`, so both
builds need a base path, read from one env var, `SITE_BASE` (default `""`
for local dev):

- **SvelteKit:** `kit.paths.base = process.env.SITE_BASE ?? ""`. Every
  internal link goes through `$app/paths`'s `base`.
- **VitePress:** ``base: `${SITE_BASE}/docs/` ``. It already writes into
  `../build/docs` (`config.ts:9`), so the two builds share one artifact
  without a merge step.
- **404 / SPA fallback:** set `adapter-static`'s `fallback: "404.html"` (in
  place of `index.html`, `svelte.config.js:7`). Pages serves `404.html` for
  any unknown path, and SvelteKit's client router then resolves it. Routes
  are prerendered (`export const prerender = true` in the root layout), so the
  fallback only catches true misses. VitePress ships its own `404.html`
  inside `docs/`.
- **`.nojekyll`:** written to `build/` by the website build itself, so a
  local `preview` matches Pages. Without it, Jekyll drops `_app/`.
- **Custom domain:** not set. A `CNAME` file and `SITE_BASE=""` are the whole
  change if the operator picks one (open question 1).

PR CI is not slowed. Pages runs only on `main`. The PR check is the existing
`Website` job (`ci.yml:2124`), re-enabled by
`website-docs-typedoc-fails-under-ts5`. It already runs only on PRs that touch
`packages/website/` or carry the `website` label, and only on hosted runners.
The deploy story adds `SITE_BASE=/trails` to that job, so the PR build
exercises the same paths.

Repo settings (Pages source "GitHub Actions") are operator actions. The
story lists them, but cannot make them.

### 3. Docs for every published package

- **TypeDoc from the package list** (`website-typedoc-from-package-list`).
  `typedoc.config.mjs` builds `entryPoints` by reading `packages/*/package.json`
  and keeping each one where `private` is not `true`. Each package's entry is
  its `exports["."]` source file (`lib/index.ts`, or the `"."` target for the
  14 packages without one), so a new package appears with no edit. The block
  and exclude tag list is read from the receipt-tag names the eslint rules
  already enumerate, so no tag warns. The VitePress `/api/` sidebar
  (`config.ts:40-52`) is generated the same way, grouped as in § 4. `api/**`
  stays out of local search (`config.ts:58-71`) for the build-size reason
  recorded there.
- **Live parity numbers** (`website-parity-numbers-at-build`). The site reads
  `scripts/parity/output/package-summary.json` (`scripts/parity/package-summary.ts:3,43`),
  which joins api-compare and test-compare per package. It does not recompute
  that file. CI's `rails-comparison` job already runs `pnpm parity:packages`
  and, on every push to `main`, uploads it in the `parity-outputs-<sha>`
  artifact with 90-day retention (`.github/workflows/ci.yml:2584-2601`). The
  Pages build downloads the newest such artifact from a successful `main` run
  (`gh run download`, `actions: read`). That costs seconds rather than a
  second parity run. The data is exposed through a VitePress data loader and
  a prerendered SvelteKit load. A missing artifact renders "—", never a stale
  hand-typed number, and each figure shows the commit it was measured at.
- **Per-package deviation pages** (`website-per-package-deviation-pages`).
  Each published package gets `docs/packages/<pkg>.md`: its Rails
  counterpart, its parity numbers, and its ratified rules. The rules are every
  `##` / `###` section of `packages/<pkg>/CLAUDE.md`, plus each root
  `CLAUDE.md` section that the package's own receipts cite (the per-package
  `tagSites` / `permanentSkips` in `package-summary.json` already resolve each
  citation to a `claudeSections` anchor). Each appears as its heading, its
  one-line rule and a link to the section on GitHub, at the pinned commit.
  `package-summary.ts` already parses these (`claudeSections`). The page is
  generated, so it cannot drift from the rule. The three hand-written
  deviation pages are retired into it. Their still-true prose moves to
  `idioms.md` or the generated page's intro, and their stale claims (§
  Motivation table) are deleted, not carried.
- **Guides index on the Rails Guides TOC** (`website-guides-index-follows-rails-guides`).
  `docs/guides/index.md` takes the section order of
  `vendor/rails/v8.0.2/guides/source/documents.yaml` (Start Here, Models,
  Views, Controllers, Other Components, Digging Deeper, Going to Production,
  Advanced Active Record, Extending Rails). Each Rails guide is a row: a
  written trails guide, "not yet written" linking its story, or "not
  applicable" with the ruling (Asset Pipeline → the Vite section; Install
  Ruby on Rails → Getting Started). Outside those nine sections, Contributing
  is one link to `CONTRIBUTING.md`, and Policies and Release Notes are
  omitted. Guides are written from scratch.
  `LICENSES.md:46-51` already rules out adaptation, since Rails Guides are
  CC BY-SA 4.0. The story files one story per unwritten applicable guide,
  through `pnpm tasks new`, once this RFC has a number. Code blocks in guides
  stay under the existing guides typecheck (`scripts/guides-typecheck/`, CI
  `GUIDES_PKGS_RE`, `ci.yml:146`).
- **Getting Started guide** (`website-getting-started-guide`) is the first
  written guide. It is the README Quickstart expanded, and it runs in CI
  (§ 4).

### 4. Landing page modeled on rubyonrails.org

The reference structure is rubyonrails.org as of 2026-11-18. The hero is
captured at `assets/rubyonrails-org-hero-2026-11-18.png`. The remote browser
API in this environment cannot scroll, so the rest of the page is recorded
below as structure. `website-landing-page-rebuild` captures the remaining
viewports before it starts, and adds them beside the hero.

| Order | rubyonrails.org section                                                                   | Layout                                                    | trails section                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0     | Announcement bar                                                                          | Full-width thin band, one link                            | Latest release or headline parity figure                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 1     | Nav with centered roundel logo, four links each side                                      | Symmetric, centered wordmark                              | trails wordmark centered; Docs, Guides, API, Packages / Source, Parity, Changelog, GitHub                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 2     | Hero: two-line display headline, bold subhead, two-line lede, version pill, editor video  | Centered, very large heavy display face, one accent color | The fidelity thesis as the headline ("A Rails dev would recognize this as the same method"), a subhead naming TypeScript, the lede, a version / parity pill, and an editor frame showing a real generated controller                                                                                                                                                                                                                                                                                                                                                                                                             |
| 3     | "You're in good company": logo grid                                                       | Grid of monochrome logos                                  | Community band: contributors, packages shipped, tests ported. **No third-party logos** until there are real users who agree (open question 4)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 4     | "Building it together": one centered block + CTA                                          | Narrow centered column                                    | How trails is built: the Rails source is vendored, every method is compared, the gates. CTA to CONTRIBUTING                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 5     | "Everything you need": intro + four code/text blocks (models, controllers, views, routes) | Alternating two-column blocks, code on one side           | The same four (Active Record model, Action Controller, Action View template, routes), each with real trails code taken from the walkthrough app, then the package grid grouped like Rails' frameworks: **Models** (activerecord, activemodel, arel), **Controllers & views** (actionpack, actionview, rack and the `rack-*` ports), **Other components** (actionmailer, actionmailbox, actiontext, activejob, activestorage, actioncable, activesupport), **Rails 8 defaults** (`solid-*`, turbo, stimulus, `vite-*`), **Gems** (the other gem ports), **Tooling** (activerecord-cli, trails-tsc, tse-compiler, vitest-matchers) |
| 6     | "Optimized for happiness": short text + link                                              | Narrow centered column                                    | Why a faithful port: one Rails mental model, two runtimes. Link to Idioms                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 7     | "Let's get started": three cards (Learning, Contributing, Keeping up)                     | Three equal columns                                       | The walkthrough steps (`trails new` → model → controller) as three numbered cards, each linking the Getting Started guide                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 8     | Footer: link lines + utility row                                                          | Two text rows                                             | Links, license line (MIT / CC BY 4.0), and the Rails credit line                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

Typography and rhythm to match: one heavy geometric display face for the
headlines, a neutral sans for body, a single saturated accent on a near-white
ground, generous vertical whitespace between sections, and centered narrow
columns alternating with full-width bands. The current page's dark forest
palette is replaced. The SVG wordmark (`+page.svelte:348-351`) is kept as
trails' own mark.

Rules for the brand, which every landing story repeats in its acceptance
criteria:

- No Rails logo, roundel, wordmark, screenshot, image or copied sentence.
  "Rails" and "Ruby on Rails" are trademarks of David Heinemeier Hansson
  (`_license.html.erb:2`).
- The footer carries one credit line, worded by the operator (open question
  3). The draft wording is: "trails is an independent TypeScript
  re-implementation of Ruby on Rails. Rails is a trademark of David Heinemeier
  Hansson; trails is not affiliated with or endorsed by the Rails project."
- Fonts are self-hosted or system. The current page loads Google Fonts
  (`+page.svelte:43-47`), which is a third-party request on every visit
  (open question 2).

**The walkthrough actually runs.** The landing's code and the Getting Started
guide take their blocks from the README Quickstart. CI already runs that
section command by command and diffs every output block
(`scripts/quickstart/run.sh:1-36`, `ci.yml:1304-1316`). The site reads those
blocks at build time instead of keeping a copy. A walkthrough step the site
needs and the Quickstart lacks (a controller, say) is added to the Quickstart,
so `run.sh` covers it. The site never shows an unrun command.

## Non-goals

- **Frontiers.** The in-browser tutorial and sandbox are deleted, and bringing
  them back is out of scope. A future RFC would start from a deployed site and
  the current trailties, not from this code.
- **A hosted backend.** The site is static on Pages. There is no server, API,
  database, auth or form endpoint.
- **A search service.** VitePress local search only. Algolia DocSearch or
  similar would need a justification this RFC does not have: the API is
  navigable by sidebar, and guide prose is small enough to index locally.
- **Rewriting Rails Guides prose.** Guides are written from scratch, one story
  each. This RFC writes only Getting Started.
- **Versioned docs.** One version, `main`. Per-release docs wait for a
  publishing cadence.
- **Re-homing `docs/` in the repo root** (infrastructure docs, the frozen
  `docs/activerecord/`). Those are contributor docs, not site content.

## Alternatives considered

- **Keep Frontiers and fix it.** It is the source of both SvelteKit build
  failures and of ten open stories, and it carries a second alias table. It
  needs a sql.js engine RFC 0187 would otherwise not build. Removing it puts
  a site live this week, and fixing it does not.
- **VitePress for everything, no SvelteKit.** VitePress's `layout: home` cannot
  express the reference layout's alternating code bands without a custom Vue
  theme, which would be the same work in a second framework. SvelteKit stays
  for `/` and VitePress for `/docs/`, as today.
- **Deploy from a `gh-pages` branch.** `actions/deploy-pages` needs no branch,
  no force-pushes and no token with `contents: write`.
- **Hand-maintained TypeDoc list with a CI guard.** A guard is another list
  to keep in step (see `make-new-package-registration-self-maintaining`).
  Reading `package.json` is the list.

## Rollout

1. **Phase 1, live early:** `website-remove-frontiers`, then
   `website-pages-deploy-workflow` (also gated on
   `website-docs-typedoc-fails-under-ts5`). The trimmed site, with its stale
   content, is live at the Pages URL. `website-docs-typedoc-fails-under-ts5`
   and `website-typedoc-backslash-angle-double-escaped` sit in other RFCs
   (0061 and 0127) as `draft`. Activating this RFC does not make them ready,
   so the operator promotes them with `pnpm tasks status-set <id> ready`
   alongside `rfc-status … active`.
2. **Phase 2, docs:** `website-typedoc-from-package-list`,
   `website-parity-numbers-at-build`, `website-per-package-deviation-pages`,
   `website-guides-index-follows-rails-guides`, then
   `website-getting-started-guide`. The first four are independent of each
   other and depend only on the deploy.
3. **Phase 3, landing:** `website-landing-page-rebuild` (structure, type, art),
   then `website-landing-package-grid-and-numbers` (needs the parity data) and
   `website-landing-walkthrough-from-quickstart` (needs the Getting Started
   guide's Quickstart additions).

## Verification

- The Pages URL serves `/` and `/docs/` from the last `main` commit that
  touched the site, and a deep link (`/trails/docs/packages/activerecord`)
  loads on refresh.
- `pnpm --filter @blazetrails/website build` exits 0 on `main`, and the CI
  `Website` job runs (no `false &&`).
- `git grep -i frontiers -- packages/website .github` finds nothing.
- The API sidebar lists 54 packages, and `typedoc` reports 0 errors and 0
  `unknown block tag` warnings (11 errors and 162 warnings today).
- 54 per-package pages exist, and none of them has a hand-typed parity figure.
- The landing page has no hand-written code block. The walkthrough story's test
  asserts that each block came from the README Quickstart.
- Every guide in `vendor/rails/v8.0.2/guides/source/documents.yaml`'s Start Here
  through Extending Rails sections appears in the guides index, and
  Contributing appears as one link to `CONTRIBUTING.md`.

## Open questions

1. **Domain.** Ship at `blazetrailsdev.github.io/trails/`, or under a custom
   domain (which removes the base path)? Recommendation: ship the project URL
   in Phase 1, since the deploy story makes the switch a two-line change.
2. **Analytics.** None, a cookieless counter (Plausible, GoatCounter), or
   GitHub's Pages traffic only? Fonts fall under the same decision: today's
   Google Fonts request is a third-party call. Recommendation: no analytics
   and self-hosted fonts until there is a question the numbers would answer.
3. **Guide licensing and credit.** `LICENSES.md:46-51` already rules out
   adapting Rails Guides (CC BY-SA 4.0 vs. trails' CC BY 4.0). Confirm that
   ruling still stands, or decide to move the guides to CC BY-SA, so that
   Rails prose can be adapted. Also: the footer credit line's wording, and
   whether `LICENSES.md`'s broken pointer to `docs/rails-guides-migration-plan.md`
   should be removed or the plan written. Recommendation: keep CC BY, delete
   the pointer, and have the guides index story state the rule inline.
4. **Community band.** Before trails has users, the band shows project
   figures (contributors, packages, tests). Confirm, or drop the section until
   there are logos to show with permission.
5. **Frontiers deletion and the LOC ceiling.** `website-remove-frontiers`
   deletes about 9,400 lines and adds almost none. Waive the ceiling for a
   deletion-only PR, or split it (components / engine / routes and deps).
   Recommendation: waive. A split leaves a broken intermediate site, and the
   diff has nothing to review line by line.

## Changelog

- 2026-11-18: initial RFC
- 2026-11-18: review fixes: one guides-index scope, a Tooling group, the Pages
  path filter stated once and including `README.md`.
- 2026-11-18: parity figures come from CI's `parity-outputs-<sha>` artifact
  rather than a second parity run; the per-package audit is rewritten as a
  list; deviation-page sections are selected by receipt citations; the
  cross-RFC draft deps are flagged in Rollout; a daily Pages rebuild refreshes
  the figures.
