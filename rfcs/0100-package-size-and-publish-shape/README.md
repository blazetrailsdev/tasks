---
rfc: "0100-package-size-and-publish-shape"
title: "Package size, publish shape and release process"
status: active
created: 2026-08-11
updated: 2026-11-23
owner: "@deanmarano"
packages:
  - "activerecord"
  - "activemodel"
  - "activesupport"
  - "arel"
  - "date"
  - "i18n"
  - "globalid"
  - "did-you-mean"
  - "trailties"
  - "ruby-compat"
clusters: []
related-rfcs:
  - "0192-package-entry-point-boot-cost"
priority: 4
---

## Summary

`@blazetrails/activerecord` publishes **28.49 MB unpacked across 6,239 files**
(5.42 MB tarball), and **54% of that is compiled test code**. A consumer who
installs it gets a **44.77 MB** dependency closure. An app that writes
`import { Base } from "@blazetrails/activerecord"` and bundles it with esbuild
gets **1.82 MB minified / 528 KB gzipped** — and, if it has not installed any
of the five optional native drivers, **gets a hard build failure instead**,
because the adapter registry statically reaches `pg`, `mysql2` and
`better-sqlite3` from the root entrypoint.

The repo also has no way to release: 56 `packages/*`, 55 of them public,
all at `0.1.0`, with no changesets, no root release script and no publish
job. This RFC also defines how trails versions and publishes its packages,
on the model Rails uses for its gems.

This RFC burns the size down. The measured floor with no behavior change at all is
**7.36 MB unpacked / 842 files / ~1.87 MB tarball** — a 74% reduction from
shipping only what a consumer can actually use.

All numbers below are measured, not estimated: full `pnpm build` at
`38f55f798`, `npm pack --dry-run --json` per package, a closure assembled by
extracting each packed tarball into a temp `node_modules`, and
`esbuild@0.25.5 --bundle --format=esm --minify --platform=node --metafile`.

## Motivation

trails is a re-implementation of Rails, and Rails' own gems do not ship their
test suite, their fixtures, or their test models to consumers — `activerecord-
8.0.x.gem` ships `lib/` only. Shipping `dist/**/*.test.js`, `dist/test-helpers/`
and the canonical schema is not a fidelity question with two defensible sides;
it is a packaging defect.

Three of the findings are also fidelity defects in their own right:

- **Adapter loading is eager where Rails' is lazy.** Rails resolves an adapter
  by `require`-ing it inside `resolve` at connect time
  (`activerecord/lib/active_record/connection_adapters.rb`), so an app that
  never names `postgresql` never loads `pg`. trails registers all eight loaders
  at module scope (`packages/activerecord/src/connection-adapters.ts:126-165`),
  each as a dynamic `import()` with a **static string literal** — which every
  bundler follows. `base.js` → `connection-handler.ts:28` →
  `connection-adapters.js` → all five drivers. The result is both ~205 KB of
  dead adapter code in every app bundle and a build error for the common case
  of a SQLite-only app.
- **A rake-task module is on the runtime path.**
  `packages/activerecord/src/connection-adapters/pool-config.ts:13` imports
  `DatabaseTasks` at module scope; Rails' `DatabaseTasks` is required by the
  railtie's rake tasks, not by `ConnectionPool`.
- **Four packages publish their own `src/`** because they never grew a `files`
  field.

## Measurements

### Published package (`@blazetrails/activerecord`)

| Metric   | Value                   |
| -------- | ----------------------- |
| tarball  | 5,688,149 B (5.42 MB)   |
| unpacked | 29,876,951 B (28.49 MB) |
| files    | 6,239                   |

By kind: `.js` 13.89 MB / `.js.map` 10.90 MB / `.d.ts` 2.42 MB / `.d.ts.map`
1.26 MB. Sourcemaps are 12.16 MB (43%); `*.test.*` files are 15.51 MB (54%)
across 2,992 files. Five of the ten largest emitted `.js` files are tests
(`associations/has-many-associations.test.js` alone is 259,349 B, larger than
every non-test file except `relation.js`).

By `dist/` subdirectory: root 10.07 MB, `connection-adapters/` 4.94 MB,
`associations/` 4.37 MB, `adapters/` 1.85 MB, `relation/` 1.57 MB,
`test-helpers/` 1.45 MB, `support/` 0.95 MB, `encryption/` 0.81 MB.

### Measured trim ladder

| Remove                                                       | Unpacked    | Files   |
| ------------------------------------------------------------ | ----------- | ------- |
| _(today)_                                                    | 28.49 MB    | 6,239   |
| `*.test.*`                                                   | 12.96 MB    | 3,244   |
| + `test-helpers/ test-fixtures/ cases/ assertions/ testing/` | 11.47 MB    | 1,684   |
| + all sourcemaps                                             | **7.36 MB** | **842** |

Gzipped tarball of that trimmed tree: **1.87 MB vs 5.42 MB today (−67%)**.

### Dependency closure — 44.77 MB, 9,477 files

activerecord 28.49 · activesupport 4.54 · `@js-temporal/polyfill` 2.84 ·
activemodel 2.79 · date 1.85 · arel 1.77 · i18n 1.01 · jsbi 0.56 ·
globalid 0.50 · did-you-mean 0.13 · bcryptjs 0.11 · tinyglobby+fdir+picomatch
0.18 (MB).

Only three direct external deps exist in the whole tree (`bcryptjs`,
`tinyglobby`, `@js-temporal/polyfill`). **Native drivers are all optional
peers** (`packages/activerecord/package.json:70-93`) so an install compiles no
native code — that part is already right and this RFC must not regress it.

### App bundle — 1,904,049 B minified, 540,543 B gzipped, 653 modules

| Group                                 | Bytes   | %     |
| ------------------------------------- | ------- | ----- |
| `activerecord/connection-adapters/**` | 420,676 | 22.1% |
| `activerecord/*` (root)               | 412,002 | 21.6% |
| `activerecord/associations/**`        | 188,527 | 9.9%  |
| `@js-temporal/polyfill` + `jsbi`      | 154,714 | 8.1%  |
| `@blazetrails/activesupport`          | 102,782 | 5.4%  |
| `activerecord/relation/**`            | 95,965  | 5.0%  |

Avoidable subsystems: PostgreSQL tree 129,160 B · MySQL tree 70,438 B ·
SQLite tree 55,359 B · `migration` 43,351 B · `encryption/` 37,037 B ·
`tasks/` 34,578 B · libsql+expo+node-sqlite 8,388 B.

One genuinely good result worth recording so nobody re-investigates it: **no
test-helper, fixture, or canonical-schema module is reachable from the public
entrypoint.** A metafile scan of the 653 bundled inputs for
`test-helpers|test-fixtures|canonical|\.test\.|fixtures` returns zero hits.
That weight is install-time only, which is what makes the packaging stories
purely additive-free wins.

## Versioning and release

Rails publishes each framework gem separately but versions them in
lockstep: every gemspec reads one `RAILS_VERSION`
(`vendor/rails/v8.0.2/RAILS_VERSION`), pins its framework dependencies to
that exact version (`vendor/rails/v8.0.2/activerecord/activerecord.gemspec:38-39`),
and the `rails` gem is a code-free meta-gem over the set
(`vendor/rails/v8.0.2/rails.gemspec`). trails follows the same model:

- **Separate packages, one version.** Every public package is bumped and
  published together, changed or not. No compatibility matrix between
  `@blazetrails/*` packages.
- **Exact internal pins.** `workspace:*` publishes as an exact version. This
  matters more in JS than in Ruby: two installed copies of `activesupport` or
  `ruby-compat` silently break `instanceof`, `Symbol.for` brands, `TopLevel`
  seats and `classAttribute` chains.
- **A `trails` meta-package** over the framework set, as `rails` is.
- **Third-party gem ports** (`thor`, `mail`, `tzinfo`, `nokogiri`, `rack`,
  …) carry the trails version; the upstream version they port is metadata.
- **One monolith package was considered and rejected**: it forces every
  consumer to install `image-processing`, `nokogiri`, `solid-queue` and the
  rest, hides standalone ports, and breaks the gem-to-package mapping; a
  later split would break every import.
- **Pre-1.0**, a minor bump may break and a patch does not.

The size stories below land before the first real publish.

### First alpha prerelease

The first prerelease is `0.1.0-alpha0.1`, published by `release.yml` on the
tag `v0.1.0-alpha0.1` under the dist-tag `alpha` (a tag containing `-alpha`
publishes as `alpha`, any other as `latest`). Each later practice publish
bumps the last segment (`pnpm release:version 0.1.0-alpha0.N`, then tag
`v0.1.0-alpha0.N`). Install with `@blazetrails/trails@alpha`; its
`dependencies` are exact pins at the same version.

## Scope

In scope: versioning, internal pins, the meta-package, the
published/private split, the release workflow, and what the packages publish (`files`, emitted tests, sourcemaps), the
eager module-scope edges that drag adapters and rake tasks into an app bundle,
`sideEffects` declarations, and a CI budget so none of it regresses.

Out of scope: splitting `activerecord` into subpackages; changing the public
API surface; making anything lazier than Rails is; touching the optional-peer
arrangement for native drivers (already correct).

## Decision: which sourcemaps ship

Packages publish `.js.map` and not `.d.ts.map` (option (b) of
`stop-publishing-sourcemaps`). A `.d.ts.map` only lets an editor jump from a
`.d.ts` to the `.ts` it came from, and no package ships its `lib/`, so on a
consumer's disk it points at nothing. A `.js.map` still works there: under
`--enable-source-maps` Node maps a stack frame to the original file and line
from the map alone, which keeps traces into trails internals readable. Shipping
`lib/` as well (option (c)) was not taken.

`tsc` still emits both kinds, because local development and the parity tooling
read them. Only the tarball changes, through a `"!dist/**/*.d.ts.map"` entry in
each published package's `files`. The shared `tsconfig.json` cannot do this,
because it controls emit, not packing. `@blazetrails/activerecord` went from
5,905,671 B unpacked, 1,515 files and a 1,092,535 B tarball to 5,022,962 B,
1,137 files and 947,726 B.

## Non-goals / risks

- **Do not break `dist/` for the repo's own test runs.** Vitest runs from
  `src`, but `dx-tests`, `virtualized-dx-tests`, the parity tooling, and
  `activerecord-cli` read built output. Every publish-shape story must verify
  those still resolve.
- **`sideEffects: false` is wrong for this codebase** — much of AR _is_
  registration side effects. Only the accurate array form is acceptable.
- **`test-helpers/` may be intentionally published** for downstream consumers
  to reuse the canonical models. If so, the answer is a separate
  `@blazetrails/activerecord-testing` package, not silence.

## Stories

1. `exclude-compiled-tests-from-published-dist` — −15.5 MB (−55%)
2. `stop-publishing-sourcemaps` — −12.16 MB
3. `unpublish-activerecord-test-harness` — −1.52 MB
4. `lazy-adapter-driver-resolution` — ~205 KB bundle, removes the build error
5. `accurate-side-effects-declarations` — ~115 KB tree-shakeable
6. `pool-config-database-tasks-eager-import` — 20 KB, fidelity
7. `files-field-for-leaf-packages` — −1.33 MB closure
8. `temporal-polyfill-runtime-native-preference` — 154 KB bundle
9. `package-size-budget-ci-gate` — ratchet the above

Release process:

1. `lockstep-version-across-public-packages`
2. `exact-internal-pins-on-publish`
3. `trails-meta-package`
4. `classify-published-and-private-packages`
5. `release-publish-workflow`

RFC 0192 measures a different unit on the same subject: modules Node resolves
and executes at boot, unbundled, rather than published or bundled bytes. Its
`boot-graph-measurement-harness` watches the same class of regression as story
9 above — a new module-scope import pulling a subsystem onto a hot path — so
whichever of the two lands second should extend the first rather than stand up
a second measurement tool.

## Provenance

Chartered from a measurement pass on branch `ar-package-size-20338f`
(2026-08-11), commit `38f55f798`. Full report with per-file tables, the complete esbuild top-20, and the
per-package closure breakdown: [`measurements.md`](./measurements.md) in this
directory.
