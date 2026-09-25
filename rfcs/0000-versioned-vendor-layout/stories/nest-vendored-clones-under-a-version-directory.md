---
title: "Nest vendored clones under a version directory"
status: ready
updated: 2026-09-25
rfc: "0000-versioned-vendor-layout"
cluster: vendor
packages:
  - activerecord
deps: [route-vendor-path-construction-through-sources-ts]
deps-rfc: []
est-loc: 300
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Every vendored clone root is `join(VENDOR_DIR, source.name)` and nothing else:
`destFor` (`vendor/fetch.ts:73-74`, used at `:86`, `:151`, `:177`), `resolvePath`
(`vendor/sources.ts:487-500`), `vendoredRoot` (`:517-522`),
`libEntryFilesManifest` (`:536`), `libPathsManifest` (`:548-553`) and
`testPathsManifest` (`:570`). Those six are the whole surface: every script and
CI step reaches the tree through an absolute path one of them returned, or through
`pnpm vendor:fetch --print-paths` / `--print-lib-paths` / `--print-test-paths` /
`--print-lib-entry-files` (`.github/workflows/ci.yml:1609-1611`,
`package.json:67`).

The clones are gitignored, so no tracked file moves. Two path globs assume the
current depth: `.prettierignore:13` (`vendor/*/`) and the CI cache
`path: vendor/*/` (`.github/workflows/ci.yml:1597`), whose comment explains it
must not swallow the tracked files under `vendor/`. `scripts/start-worktree.sh:237-262`
symlinks `vendor/<name>` per source after validating main's clone HEAD against the
new worktree's `vendor/sources.lock.json`.

About 40 committed assertions hardcode the current depth and move with it:
`vendor/sources.test.ts` has 23 `endsWith("vendor/<source>/…")` checks
(`:73-75,100-102,132,162-164,192-194,255,260,272,320-325,351-353`),
`scripts/api-compare/ar-closure.test.ts` writes 9 fake-tree paths (`:7,22-45`),
and one each sits in `scripts/rails-find/core.test.ts:59,80,106,123`,
`scripts/schema-compare/compare.test.ts:541`,
`scripts/ci-suite-coverage.test.ts:1102` and
`scripts/api-compare/story-skip-conflicts.test.ts:18`. These are fixtures, not
citations, so they are hand-updated here rather than by the codemod.

`vendor/.gitignore` is `*` plus an allowlist of the tracked registry files, so it
is depth-independent and must NOT be changed.

MRI's ref is the tag `v3_3_11` (`vendor/sources.lock.json`), so the version
directory name is derived from the ref rather than copied from it — see RFC Open
question 1.

## Acceptance criteria

- A single exported helper in `vendor/sources.ts` derives a source's version
  directory name from the lockfile ref (`v8.0.2` → `v8.0.2`, `v3_3_11` →
  `v3.3.11`), with a unit test in `vendor/sources.test.ts` covering both shapes.
- `destFor` and the five resolvers above join that segment; no caller outside
  `vendor/` changes.
- `.prettierignore` and the ci.yml cache `path` follow the new depth, and the
  ci.yml comment still states why the glob is not `vendor/`.
- `scripts/start-worktree.sh` symlinks the versioned clone directory, keeps the
  HEAD-vs-lockfile validation, and its per-source fetch fallback still works.
- `pnpm vendor:fetch` on a clean checkout yields `vendor/rails/v8.0.2/`,
  `vendor/ruby/v3.3.11/` and nine siblings.
- The ~40 path assertions above are updated by hand and no test name changes.
- `vendor/.gitignore` is untouched, and the PR body says why.
- `pnpm parity:api`, `parity:test`, `parity:fixtures` and `parity:schema` deltas
  are zero, and `pnpm rails:find <query>` prints versioned paths (its maps come
  from the registry as of the previous story, so this needs no edit there).
- No citation is rewritten in this story.
