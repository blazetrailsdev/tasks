---
rfc: "0000-package-layout-mirrors-a-rails-gem"
title: "Package layout mirrors a Rails gem: lib/ and test/"
status: draft
created: 2026-11-05
updated: 2026-11-05
owner: "@deanmarano"
packages:
  - actioncable
  - actionmailer
  - actionpack
  - actionview
  - activejob
  - activemodel
  - activerecord
  - activerecord-cli
  - activestorage
  - activesupport
  - arel
  - bcrypt
  - builder
  - chronic
  - date
  - did-you-mean
  - et-orbi
  - fugit
  - globalid
  - html-sanitizer
  - i18n
  - image-processing
  - mail
  - marcel
  - mini-magick
  - mini-mime
  - msgpack
  - net-smtp
  - nokogiri
  - raabro
  - rack
  - rack-session
  - rack-test
  - rackup
  - rake
  - ruby-compat
  - scripts
  - solid-cable
  - solid-queue
  - thor
  - trails-tsc
  - trailties
  - tse-compiler
  - tzinfo
  - vitest-matchers
  - website
  - zeitwerk
clusters:
  - layout-tooling
  - layout-migration
---

<!-- Unnumbered until merge: copy this dir to `rfcs/0000-your-slug`, keep `rfc:`
     as 0000-your-slug and the H1 below number-free. `scripts/finalize-rfc.mjs`
     swaps 0000 for the assigned number at merge. Never use a `draft-` prefix —
     `draft` is a lifecycle status, not a dir prefix (see top-level README). -->

# RFC — Package layout mirrors a Rails gem: lib/ and test/

## Summary

Every trails package root becomes `lib/` + `test/`, as a Rails gem's is.
`packages/<pkg>/src/` is renamed `packages/<pkg>/lib/`, and every `*.test.ts`
and `*.trails.test.ts` moves out of it into `packages/<pkg>/test/`, laid out
the way the upstream gem lays out its own `test/` tree (activerecord:
`test/cases/`, `test/models/`, `test/fixtures/`, `test/schema/`, …). The
source tree is not otherwise restructured. Each package migrates in one bulk
mechanical PR (`git mv` plus path rewrites only), a small pilot first and
activerecord last, after one tooling-prep PR teaches every script, lint rule,
config and CI glob the new layout.

## Decisions already made (repo owner, 2026-11-05)

1. **Tests leave `lib/`.** Every `*.test.ts` / `*.trails.test.ts` moves from
   `src/` to `packages/<pkg>/test/`, at the path Rails' own test tree gives it.
   activerecord's `src/test-helpers/models/` and `src/test-helpers/fixtures/`
   move to their Rails homes, `test/models/` and `test/fixtures/`.
2. **`src/` is renamed `lib/` in the same pass**, per package. Filenames stay
   kebab-case; `PATH_SEGMENT_ALIASES` and `RUBY_FILE_TS_OVERRIDES`
   (`scripts/parity/conventions.ts`) keep their meaning with `lib/` as the
   root. There is no `lib/active_record/` nesting and no snake_case.
3. **One package at a time**, each a bulk mechanical move so
   `git log --follow` and `git blame` survive; a small pilot first, activerecord
   last.

## Motivation

Measured at trails `b2e38a2ae5` (2026-11-05):

- **The build compiles the test suite.** Every package `tsconfig.json` has
  `"rootDir": "src"`, `"include": ["src"]` (e.g.
  `packages/arel/tsconfig.json`), and the root `tsconfig.json` excludes only
  `node_modules` and `dist`. So the 3,023 colocated test files under
  `packages/*/src/` are type-checked and emitted into `dist/` alongside the
  library, and published wherever `"files": ["dist", …]` ships `dist`. Only 3
  packages carry a `tsconfig.test.json` at all (ruby-compat's: `rootDir src`,
  `include src/**/*.test.ts`, `outDir dist-test`).
- **The test count is concentrated**: activerecord 982, actionpack 306,
  activesupport 285, trailties 214, actionview 122, activemodel 120,
  ruby-compat 115, arel 102; 38 other packages hold 1–78 each.
- **Fidelity.** A Rails gem is `lib/` + `test/`. A trails test's Rails
  counterpart is found today by name (`parity:test`, `pnpm rails:find`), never
  by path, because `src/relation/where.test.ts` and
  `test/cases/relation/where_test.rb` share no path shape. With `test/` laid
  out as Rails lays it out, the mapping is a path translation through the same
  conventions table `parity:api` already uses for `lib/`.
- **Helpers in the wrong home.** activerecord's canonical models, fixtures and
  schema mirror live in `src/test-helpers/` and `src/support/`, inside the
  library tree, where Rails keeps them in `test/models`, `test/fixtures`,
  `test/schema`, `test/support`.

## Design

### Target layout

```text
packages/<pkg>/
  lib/            # was src/, files unchanged, tests removed
  test/           # every *.test.ts, *.trails.test.ts and test-only helper
  tsconfig.json   # rootDir lib, include lib
  tsconfig.test.json  # rootDir ., include test, references ./tsconfig.json
```

`dist/` keeps its current shape: `rootDir: "lib"` emits `lib/foo.ts` to
`dist/foo.js` exactly as `src/foo.ts` does today, so no `package.json`
`exports` entry changes.

### Where a test lands

For each moved file, in order:

1. **It name-matches a Rails test file** in the test-compare manifest: it goes
   to that Rails file's path, through the conventions table
   (`test/cases/relation/where_test.rb` → `test/cases/relation/where.test.ts`;
   `_test.rb` → `.test.ts`, snake → kebab, `PATH_SEGMENT_ALIASES` applied).
2. **It is a `*.trails.test.ts`** sibling of a file placed by rule 1: it lands
   beside that file.
3. **Otherwise** it lands under the gem's main test directory at its `lib/`
   path (activerecord `test/cases/<lib path>`; a gem with a flat `test/`,
   `test/<lib path>`).

Test-only support files (anything imported only from tests, today under
`src/test-helpers/`, `src/support/`, `test-setup/`, `__fixtures__/`) move to
the gem's matching Rails directory when one exists (`test/models`,
`test/fixtures`, `test/schema`, `test/support`, `test/migrations`,
`test/assets`), else `test/support/`. A support file `lib/` code imports stays
in `lib/` and is flagged in the PR body; it is a layering finding, not part of
the move.

Gems whose upstream uses `spec/` (thor, mail, fugit, raabro, et-orbi) still
use `test/` at the package root, with the spec tree's layout inside it (see
Open questions).

The move table is generated, not hand-written: the tooling-prep story adds
`scripts/layout/plan-test-moves.ts <pkg>`, which prints `old → new` for every
file by the rules above and applies them with `git mv` on `--apply`. Each
package PR is that script's output plus the rewrites below.

### What a package PR does (mechanical only)

1. `git mv packages/<pkg>/src packages/<pkg>/lib`, in its own commit, so
   rename detection is 100%.
2. `plan-test-moves --apply`, in a second commit.
3. Path rewrites, in a third: relative imports in moved tests and in `lib/`
   files that imported a moved helper; the package's `tsconfig.json`,
   new `tsconfig.test.json`, `package.json` scripts/`bin`/`files` that name
   `src`; every repo-wide reference enumerated by
   `scripts/layout/src-references.ts <pkg>` (tooling-prep), which must print
   nothing afterwards.
4. No behaviour change, no test rename (test names are parity keys), no
   content edit beyond import specifiers and path strings.

Rename-only diffs count as zero LOC; the rewrite commit is what is measured.
These PRs fall under CLAUDE.md's "single mechanical rename" exception to the
LOC ceiling, and say so in the body.

### Interim measure

Until a package migrates, its build excludes tests: the interim story adds
`"exclude": ["src/**/*.test.ts", "src/**/*.trails.test.ts", "src/test-helpers/**"]`
(plus the package's existing excludes) to every package `tsconfig.json`, and a
`tsconfig.test.json` that includes them and references the library build, so
`pnpm typecheck` still type-checks every test. A package that migrates drops
that exclude because its `lib/` holds no tests.

### Inventory of everything that assumes `src/` or colocated tests

Counted with `grep -rlE '\.test\.ts|/src/|"src"'` at `b2e38a2ae5`: 124 files
under `scripts/`, 54 under `eslint/`, `.github/workflows/ci.yml`, 13 root
`CLAUDE.md` lines, and 43 files across `packages/*/CLAUDE.md`, `docs/`,
`CONTRIBUTING.md`, `README.md`. The tooling-prep story makes every one of
these layout-agnostic (accepting both `src/` and `lib/`+`test/` per package
while the migration runs); the package stories then need no tooling edit.

Parity and compare tooling:

- `scripts/api-compare/ts-file-walk.ts` — `walkTsFiles(<pkg>/src)`,
  `COMMITTED_TS_FILES` "under `packages/<pkg>/src`", its `.test.ts` filter
  (lines 6-8, 37-40, 141-156).
- `scripts/api-compare/extract-ts-api.ts`, `lint-calls.ts`, `call-args.ts`,
  `extra-surface.ts`, `lint-deps.ts`, `class-paths.ts`, `constant-table.ts`,
  `config.ts`, `compare.ts`, `receipt-audit.ts`, `naming-taxonomy.ts`,
  `lint-detached-jsdoc-tags.ts`, `lint-missing-rails-call-reasons.ts`,
  `enumerable-idioms.ts`, `operator-order-spelling.ts`,
  `stdlib-mixin-surface.ts`.
- `scripts/parity/conventions.ts` (comments and rules that say "src root"),
  `package-summary.ts`, `module-count.ts`, `send-count.ts`, `cast-count.ts`,
  `eslint-count.ts`, `import-cycles.ts` and `import-cycles-mark.json` (keys are
  `src/` paths), `shared-cache.ts`, `unported-files/*` (incl.
  `baseline.json`), `pipeline/**`.
- `scripts/test-compare/extract-ts-tests.ts` (`packages/${pkg}/src/**/*.test.ts`,
  `behaviors/*-behavior.ts`, the action-dispatch glob), `extract-ts-core.ts`,
  `compare.ts`, `assertion-kinds.ts`, `assertion-values.ts`,
  `normalize-skips.ts`, `apply-renames.ts`, `generate-stubs.ts` (writes new
  test files: must target `test/`), `assertion-receipts/*.ts` (path keys).
- `scripts/fixtures-compare/compare.ts`, `fixtures-inventory/inventory.ts`,
  `generate-fixture-parity-map.ts`, `generate-fixture-parity-exclude.ts`,
  `schema-compare/compare.ts`, `audit-define-schema.ts`,
  `non-transactional-row-writes.ts`.
- `scripts/stale-story-references.ts`, `vendor-recite.ts`,
  `tighten-rails-test-name-parity.ts`, `ruby-compat-leaf.ts`,
  `build-rails-privates-manifest.ts`, `stub-private-methods.ts`.
- Generators writing into `src/`: `thor-build-templates.ts`,
  `mail-parsers/generate.ts`, `generate-canonical-zone-identifiers.ts`,
  `generate-tzdata-*.ts`, the `constants*.generated.ts` writer, and
  `rails-private-methods.generated.ts`.
- `scripts/ci-suite-coverage.test.ts` and its globs (including the
  `activerecord-cli/src/__e2e__` entries), `scripts/ci/check-control-bytes.sh`,
  `scripts/generated-app-smoke.sh`, `scripts/phase-g-hunt/classify.sh`.

Configs:

- `vitest.config.ts`: every project `include` (`packages/*/src/**/*.system.test.ts`,
  `packages/thor/src/**`, `et-orbi`, `zeitwerk`, …), the AR adapter
  `exclude` lists (`packages/activerecord/src/adapters/postgresql/**`, …),
  `SQLITE_DRIVER_TESTS`, `COVERAGE_INCLUDE`, the alias table
  (`packages/activesupport/src/...`), and the `ar-db-forks-default.js` import.
  `vitest.dx-tests.config.ts`.
- Every `packages/*/tsconfig.json` (`rootDir`, `include`, `exclude`), the 3
  `tsconfig.test.json`, root `tsconfig.json`, and any `paths` mapping.
- `packages/*/package.json`: `scripts`, `bin`, `files`, `imports`, and any
  `exports` that points at `src/` rather than `dist/`.
- `eslint.config.mjs` (45 `src` lines: file globs, test-file overrides keyed
  on `**/*.test.ts` under `src`, `ignores`), and the 54 `eslint/*.mjs` rules
  and their `.json` scope/exclude lists (`no-freeform-comments-scope`,
  `no-raw-sql-scope`, `no-ruby-compat-reimplementation-exclude.json`,
  `rails-callback-invocations.json`, `rails-deprecated-methods.json`,
  `expected-fixtures`, `no-internal-canonical-loaders`, `manifest-complete`,
  `rails-error-parity*`, …). Rules that tell test from library by the
  `.test.ts` suffix keep working; rules that key on a `src/` path segment or
  on "a test sits beside its subject" do not.
- `.github/workflows/ci.yml`: the `changes` job regexes (`DB_ADAPTER_RE`,
  `GUIDES_EXCL_RE` with `/src/test-helpers`, `LINT_ALL_RE`), the
  `git ls-files 'packages/{actioncable,thor}/src/*.ts'` steps, the
  `pnpm vitest run packages/actioncable/src/subscription-adapter/*.test.ts`
  steps, and the generated-file paths (mail parsers, `constants.generated.ts`,
  `rails-private-methods.generated.ts`). Mind the `changes` job's `run:`
  script size limit.
- `.lintstagedrc` / prettier / markdownlint ignore globs naming `src/`.
- `scripts/start-worktree.sh`: verify nothing links or seeds a `src/` path
  (the `$src` there is a variable name, not the directory).

Prose:

- Root `CLAUDE.md` line 402, "Tests live next to source files as `*.test.ts`",
  becomes "Tests live in `packages/<pkg>/test/`, laid out as the upstream
  gem's `test/` tree", and the 13 `src/` path references are rewritten, as
  are the 43 `src/` references in `packages/*/CLAUDE.md`, `docs/`,
  `CONTRIBUTING.md`, `README.md`. `docs/ruby-ts-conventions.md` is
  regenerated, never hand-edited. Citation lines like
  `packages/activerecord/src/test-helpers/test-schema.ts` in CLAUDE.md move in
  the activerecord story.
- Open stories in the tasks repo cite `packages/<pkg>/src/...` paths; they are
  not rewritten (history), and `stale-story-references` must accept either.

## Non-goals

- **Restructuring `lib/`:** no `lib/active_record/` nesting, no snake_case, no
  file moves inside `lib/` beyond the rename.
- **Converting tests to the package's public entry point** (Rails tests
  `require "active_record"`): imports keep their relative specifiers.
- **Renaming any test or `describe`:** names are `parity:test` keys.
- **Moving `dx-tests/`, `virtualized-dx-tests/` or `packages/*/scripts/`:**
  they already sit outside `src/`.

## Alternatives considered

- **Keep tests colocated, exclude them from the build only:** fixes the build
  path but not fidelity or the path-based Rails mapping. It is kept as the
  interim measure.
- **One repo-wide move:** a single PR over 3,023 files conflicts with every
  open sibling PR and cannot be rebased; per package bounds the blast radius.
- **`lib/active_record/…` snake_case tree:** rejected by the owner; it would
  invalidate every conventions rule and every import for no parity gain.

## Rollout

1. Phase 0 — `lib-test-layout-interim-exclude-tests-from-build`,
   `lib-test-layout-tooling-prep` (independent).
2. Phase 1 (pilot) — `lib-test-layout-ruby-compat`. Its PR body records any
   step the plan script or a gate got wrong, folded back into tooling before
   phase 2.
3. Phase 2 — every other package story except activerecord, in any order,
   smallest first, at most a few concurrently and none touching a package
   another open PR is moving.
4. Phase 3 — `lib-test-layout-activerecord`, last; then
   `lib-test-layout-retire-src-compat`, which removes the dual-layout arms
   from tooling.

## Verification

- `find packages -path '*/node_modules' -prune -o -path '*/src' -type d -print`
  prints nothing, and no `*.test.ts` exists under any `packages/*/lib/`.
- No `dist/**/*.test.js` in any built package.
- `pnpm parity:api` and `pnpm parity:test` totals unchanged by every package
  PR (delta exactly 0, matched and total), and every ratchet mark unchanged.
- `git log --follow` on a sample moved file reaches its pre-move history.
- `scripts/layout/src-references.ts` reports zero references repo-wide.

## Open questions

1. **`spec/` gems.** thor, mail, fugit, raabro, et-orbi are RSpec upstream.
   Options: `test/` with the spec tree inside (decision 1 read literally), or
   `spec/`. Recommendation: `test/`, per the decision; the per-gem tree inside
   keeps the path mapping.
2. **Packages with no Ruby counterpart** (`website`, `vitest-matchers`,
   `trails-tsc`, `activerecord-cli`, `tse-compiler`). Recommendation: same
   `lib/` + `test/` shape, `test/` mirroring `lib/`; `website` is SvelteKit and
   may keep its framework's `src/` (to be ruled before its story is claimed).
3. **Cross-package test helper imports** (`@blazetrails/activesupport/testing/*`
   aliases in `vitest.config.ts`, `rack-test`, `actionpack` testing exports).
   Library-shipped testing modules (`ActiveSupport::Testing`,
   `ActionDispatch::Integration`) are `lib/` in Rails too and stay in `lib/`;
   only test-suite-private helpers move.
4. **Subpath imports for tests** (`"imports": { "#lib/*": … }`) instead of
   `../../lib/...` relative specifiers. Recommendation: not in this RFC
   (mechanical moves only); file separately if wanted.

## Changelog

- 2026-11-05: initial RFC
