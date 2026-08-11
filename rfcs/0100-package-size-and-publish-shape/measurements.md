# `@blazetrails/activerecord` — real installed size

Measured 2026-08-11 on branch `ar-package-size-20338f` (commit `38f55f798`), after a full `pnpm build` (`tsc --build`, 1m30s). All numbers are actual bytes, no estimates.

## Headline numbers

| Metric                                                                      | Value                                                   |
| --------------------------------------------------------------------------- | ------------------------------------------------------- |
| npm tarball (`npm pack`)                                                    | **5,688,149 B = 5.42 MB**                               |
| Unpacked on disk                                                            | **29,876,951 B = 28.49 MB**                             |
| Files shipped                                                               | **6,239**                                               |
| Full dependency closure `node_modules` (AR + 7 workspace deps + 6 external) | **44.77 MB, 9,477 files**                               |
| App bundle, `import { Base }`, esbuild ESM minified platform=node           | **1,904,049 B = 1.82 MB** (gzip **540,543 B = 528 KB**) |
| Same bundle unminified                                                      | 4,841,755 B = 4.62 MB                                   |

**More than half the published package is compiled test code.** `*.test.*` files account for **15.51 MB of the 28.49 MB (54%)** across 2,992 files.

## 1. Shipped package composition (28.49 MB unpacked)

By file kind:

| Kind                       | Size               | Files |
| -------------------------- | ------------------ | ----- |
| `.js`                      | 13.89 MB           | 1,559 |
| `.js.map`                  | 10.90 MB           | 1,559 |
| `.d.ts`                    | 2.42 MB            | 1,559 |
| `.d.ts.map`                | 1.26 MB            | 1,559 |
| **sourcemaps total**       | **12.16 MB (43%)** | 3,118 |
| **`*.test.*` (all kinds)** | **15.51 MB (54%)** | 2,992 |

By top-level `dist/` subdirectory (all file kinds, real bytes):

| Dir                    | Size        |     | Dir                                 | Size      |
| ---------------------- | ----------- | --- | ----------------------------------- | --------- |
| _(root files)_         | 10.07 MB    |     | `scoping/`                          | 0.24 MB   |
| `connection-adapters/` | 4.94 MB     |     | `validations/`                      | 0.22 MB   |
| `associations/`        | 4.37 MB     |     | `type-virtualization/`              | 0.21 MB   |
| `adapters/`            | 1.85 MB     |     | `sqlite/`                           | 0.16 MB   |
| `relation/`            | 1.57 MB     |     | `type/`                             | 0.15 MB   |
| **`test-helpers/`**    | **1.45 MB** |     | `attribute-methods/`                | 0.15 MB   |
| `support/`             | 0.95 MB     |     | `database-configurations/`          | 0.11 MB   |
| `encryption/`          | 0.81 MB     |     | **`test-fixtures/`**                | 0.07 MB   |
| `migration/`           | 0.53 MB     |     | `testing/`, `cases/`, `assertions/` | 0.08 MB   |
| `tasks/`               | 0.42 MB     |     | rest                                | < 0.05 MB |

Largest single emitted `.js` files — note that 5 of the top 10 are tests:

````text
296,452  relation.js
259,349  associations/has-many-associations.test.js
195,143  connection-adapters/postgresql-adapter.js
180,067  base.js
179,163  associations/collection-proxy.js
178,411  autosave-association.test.js
128,868  connection-adapters/sqlite3-adapter.js
127,414  associations/eager.test.js
113,600  associations.test.js
110,960  associations/has-many-through-associations.test.js
```text

### Counterfactual trims (measured, not estimated)

Starting from 28.49 MB / 6,239 files:

| Remove                                                           | Result                                     |
| ---------------------------------------------------------------- | ------------------------------------------ |
| `*.test.*`                                                       | 12.96 MB, 3,244 files (**−15.5 MB, −55%**) |
| …plus `test-helpers/ test-fixtures/ cases/ assertions/ testing/` | 11.47 MB, 1,684 files                      |
| …plus all sourcemaps                                             | **7.36 MB, 842 files**                     |

A gzipped tarball of that trimmed tree is **1.87 MB vs the current 5.42 MB (−67%)**.

## 2. Dependency closure

`dependencies` are all `workspace:*`; every native driver is an **optional peer**, so nothing native is installed by default. Confirmed by a clean install into a temp dir from `npm pack`ed tarballs of each workspace package:

| Package                                                 | Size         | Files     |
| ------------------------------------------------------- | ------------ | --------- |
| `@blazetrails/activerecord`                             | 28.49 MB     | 6,239     |
| `@blazetrails/activesupport`                            | 4.54 MB      | 1,422     |
| `@js-temporal/polyfill` (via `@blazetrails/date`)       | 2.84 MB      | 38        |
| `@blazetrails/activemodel`                              | 2.79 MB      | 598       |
| `@blazetrails/date`                                     | 1.85 MB      | 79        |
| `@blazetrails/arel`                                     | 1.77 MB      | 686       |
| `@blazetrails/i18n`                                     | 1.01 MB      | 231       |
| `jsbi` (via polyfill)                                   | 0.56 MB      | 10        |
| `@blazetrails/globalid`                                 | 0.50 MB      | 89        |
| `@blazetrails/did-you-mean`                             | 0.13 MB      | 49        |
| `bcryptjs` (via activemodel)                            | 0.11 MB      | 11        |
| `picomatch` / `fdir` / `tinyglobby` (via activesupport) | 0.18 MB      | 24        |
| **Total**                                               | **44.77 MB** | **9,477** |

Only 3 direct external deps in the whole closure: `bcryptjs`, `tinyglobby`, `@js-temporal/polyfill` (→ `jsbi`). Full external tree:

```text
├─┬ @js-temporal/polyfill@0.5.1
│ └── jsbi@4.3.2
├── bcryptjs@3.0.3
└─┬ tinyglobby@0.2.17
  ├─┬ fdir@6.5.0
  │ └── picomatch@4.0.5 (deduped)
  └── picomatch@4.0.5
```text

**Native drivers:** `better-sqlite3`, `pg`, `mysql2`, `libsql`, `expo-sqlite` are all `peerDependencies` with `peerDependenciesMeta.optional: true` (`packages/activerecord/package.json:70-93`). Good: an install pulls **zero** native code, no node-gyp, no prebuilds. `typescript >=5.0.0` is a non-optional peer, which npm will try to auto-install for consumers on npm ≥7 — worth reviewing.

## 3. App bundle (`import { Base } from "@blazetrails/activerecord"`)

`esbuild --bundle --format=esm --minify --platform=node`, native drivers marked external:

- **1,904,049 B minified / 540,543 B gzipped**, 653 input modules.

Without `--external:pg --external:mysql2 --external:better-sqlite3 --external:libsql --external:expo-sqlite`, **the bundle fails to build** — esbuild errors `Could not resolve "pg"`, `"mysql2/promise"`, `"better-sqlite3"`. Importing `Base` alone statically reaches every adapter. This is a real DX cliff: a bundler user who installed none of the optional peers gets a hard build error.

Top 20 contributors (bytes in output, minified):

```text
126,894  @js-temporal/polyfill/dist/index.esm.js
 68,426  activerecord/dist/relation.js
 64,372  @blazetrails/date/dist/date.js
 43,650  activerecord/dist/connection-adapters/postgresql-adapter.js
 39,573  activerecord/dist/associations/collection-proxy.js
 34,588  activerecord/dist/connection-adapters/sqlite3-adapter.js
 34,572  activerecord/dist/base.js
 32,569  activerecord/dist/migration.js
 31,811  activerecord/dist/relation/query-methods.js
 31,618  activerecord/dist/connection-adapters/postgresql/schema-statements-class.js
 31,595  activerecord/dist/reflection.js
 30,443  activerecord/dist/connection-adapters/abstract/schema-statements.js
 27,820  jsbi/dist/jsbi-cjs.js
 25,365  @blazetrails/arel/dist/visitors/to-sql.js
 23,701  activerecord/dist/connection-adapters/abstract-mysql-adapter.js
 21,012  activerecord/dist/connection-adapters/abstract-adapter.js
 20,199  activerecord/dist/tasks/database-tasks.js
 19,459  activerecord/dist/connection-adapters/mysql2-adapter.js
 19,246  @blazetrails/activemodel/dist/model.js
 18,681  @blazetrails/activesupport/dist/values/time-zone.js
```text

Grouped:

| Group                                 | Bytes   | % of bundle |
| ------------------------------------- | ------- | ----------- |
| `activerecord/connection-adapters/**` | 420,676 | 22.1%       |
| `activerecord/*` (root)               | 412,002 | 21.6%       |
| `activerecord/associations/**`        | 188,527 | 9.9%        |
| `@js-temporal/polyfill` + `jsbi`      | 154,714 | 8.1%        |
| `activerecord/relation/**`            | 95,965  | 5.0%        |
| `@blazetrails/activesupport`          | 102,782 | 5.4%        |
| `@blazetrails/activemodel`            | 70,703  | 3.7%        |
| `@blazetrails/date`                   | 69,536  | 3.7%        |

Cost of things a given app almost certainly doesn't all need:

| Subsystem                                            | Bytes       | %        |
| ---------------------------------------------------- | ----------- | -------- |
| PostgreSQL adapter tree                              | 129,160     | 6.8%     |
| MySQL adapter tree (incl. `abstract-mysql-adapter`)  | 70,438      | 3.7%     |
| SQLite adapter tree                                  | 55,359      | 2.9%     |
| `migration/` + `migration.js`                        | 43,351      | 2.3%     |
| `encryption/`                                        | 37,037      | 1.9%     |
| `tasks/` (`database-tasks` — CLI/rake-ish)           | 34,578      | 1.8%     |
| libsql + expo + node-sqlite                          | 8,388       | 0.4%     |
| **Adapters other than the one you use** (worst case) | **~205 KB** | **~11%** |

Good news: **no test-helpers, fixtures, or canonical schema is reachable from the public entrypoint.** A metafile scan for `test-helpers|test-fixtures|canonical|\.test\.|fixtures` in the bundle's inputs returns **zero** hits. That cost is paid on disk/install, not in the bundle.

## 4. Concrete wins, with evidence

### W1 — Stop publishing compiled tests. **−15.5 MB unpacked (−55%), −3.55 MB tarball.**

`packages/activerecord/tsconfig.json:8` is `"include": ["src"]` with `outDir: dist`, and tests live beside sources (`CLAUDE.md`: "Tests live next to source files as `*.test.ts`"). So all 748 `*.test.js` (+ their `.d.ts`, `.js.map`, `.d.ts.map`) land in `dist/` and are shipped by `"files": ["dist","bin"]` (`packages/activerecord/package.json:95-98`). Fix: a publish-time tsconfig that excludes `**/*.test.ts`, or an npm-level exclusion in `files`/`.npmignore`.

### W2 — Drop sourcemaps from the published artifact (or ship `.js.map` only). **−12.16 MB unpacked, 3,118 files.**

`.js.map` (10.90 MB) + `.d.ts.map` (1.26 MB) are 43% of the package. `.d.ts.map` in particular only helps someone go-to-definition into source that isn't shipped anyway (AR ships no `src/`).

### W3 — Don't ship the test harness. **−1.52 MB, 1,576 files.**

`dist/test-helpers/` (1.45 MB), `dist/test-fixtures/`, `dist/cases/`, `dist/assertions/`, `dist/testing/`. Includes the canonical schema (`dist/support/canonical-schema.js`, 73,828 B) and the whole model/fixture corpus. Not reachable from the entrypoint (§3), so it's pure install weight — unless it's deliberately published for consumers to reuse, in which case it belongs in a separate `@blazetrails/activerecord-testing` package.

### W4 — The adapter registry statically reaches all five drivers. **~205 KB of bundle, plus a hard build failure.**

`packages/activerecord/src/connection-adapters.ts:126-165` registers every adapter eagerly at module scope, each loader being a `import("./connection-adapters/<x>-adapter.js")`. Dynamic `import()` with a _static string literal_ is followed by every bundler, so the entire adapter tree is in the graph. The chain from the entrypoint is not optional:

- `src/connection-adapters/abstract/connection-handler.ts:28` → `../../connection-adapters.js` → all 8 loaders → `postgresql-adapter.ts` (`import pg from "pg"`), `mysql2-adapter.ts` (`import mysql from "mysql2/promise"`), `sqlite/better-sqlite3.ts:1` (`import Database from "better-sqlite3"`).
- `base.js` imports `connection-handler`, so `import { Base }` alone drags it all in.

Rails does this with `require` inside the resolve path, which is genuinely lazy. Options that keep Rails fidelity: keep the loaders but move the driver import behind a runtime-computed specifier, or split the registration table into a side-effect module the consumer opts into per adapter (the subpath exports in `package.json:8-68` already exist for this).

### W5 — Missing `sideEffects` field everywhere

No `packages/*/package.json` declares `sideEffects` (grep returns nothing across all 19 packages). Without it, bundlers must assume every module has side effects and cannot drop unreferenced ones. Given how much of AR _is_ registration side-effects, `sideEffects: false` would be wrong as-is — but the accurate form (`sideEffects: ["./dist/connection-adapters.js", ...]`) would unlock real tree-shaking of `migration`, `encryption`, `tasks` (≈115 KB minified together).

### W6 — `tasks/database-tasks.js` (20,199 B) pulled in by the pool

`src/connection-adapters/pool-config.ts:13` imports `DatabaseTasks` at module scope; `pool-config` is on the `base.js` path. A rake-task module should not be in an app's runtime bundle.

### W7 — Four workspace deps ship their `src/` and `tsconfig.tsbuildinfo`. **−1.33 MB across the closure.**

`date`, `did-you-mean`, `globalid`, `i18n` have **no `files` field** in package.json, so `npm pack` includes `src/`, `tsconfig.json`, `tsconfig.tsbuildinfo`, and (for `globalid`) `dx-tests/`. Measured overhead: date 0.64 MB, i18n 0.38 MB, globalid 0.22 MB, did-you-mean 0.09 MB. `activerecord`/`activemodel`/`activesupport`/`arel` already set `files: ["dist"]` — just add it to the other four.

### W8 — `"files": ["dist", "bin"]` names a directory that doesn't exist

`packages/activerecord/package.json:97` lists `bin`, but `packages/activerecord/bin` is absent. Harmless today; dead config.

### W9 — `@js-temporal/polyfill` is 154 KB of the bundle (8.1%) and 3.4 MB installed

Hard dep via `@blazetrails/date`. On Node ≥ 24 (this repo runs v24.16.0) `Temporal` is available natively behind a flag / shipping soon; a conditional export or `globalThis.Temporal ?? polyfill` would recover ~8% of the bundle for modern runtimes.

## Summary of achievable size

|                        | Now      | With W1+W2+W3+W7 |
| ---------------------- | -------- | ---------------- |
| Tarball                | 5.42 MB  | ~1.87 MB         |
| Unpacked               | 28.49 MB | 7.36 MB          |
| Files                  | 6,239    | 842              |
| Closure `node_modules` | 44.77 MB | ~22 MB           |

Bundle: 1.82 MB → ~1.5 MB with W4+W6 (single adapter, no rake tasks), → ~1.35 MB with W9 on a Temporal-native runtime.

---

_Method: `pnpm build`; `npm pack --dry-run --json` per package; closure assembled by extracting each `npm pack` tarball into a temp `node_modules/@blazetrails/_`and`npm install --omit=optional`for the three external deps; bundle via`esbuild@0.25.5 --bundle --format=esm --minify --platform=node --metafile`. All work in scratchpad; no source changed.\*
````
