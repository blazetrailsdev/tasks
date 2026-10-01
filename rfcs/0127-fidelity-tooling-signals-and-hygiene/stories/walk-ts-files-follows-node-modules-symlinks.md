---
title: "walkTsFiles follows node_modules symlinks and swallows walk errors"
status: draft
updated: 2026-10-01
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`walkTsFiles` (`scripts/api-compare/ts-file-walk.ts:68-79`) lists a directory
with `fsPromises.readdir(dir, { recursive: true })` and applies
`population.skipDirs` only afterwards. A recursive `readdir` follows symlinked
directories, so walking `scripts/` descends through
`scripts/guides-typecheck/node_modules/@blazetrails/*` into every workspace
package and its own `node_modules`: about 800,000 entries and 13-18 s on main,
for the ~650 files it keeps.

It also swallows every error and returns `[]`. On trails#8339 a workspace
dependency cycle (actionpack -> trailties -> actionpack) made that walk hit
`ELOOP`; `parity:api:detached` then silently checked 4131 files instead of
4783 (the whole `scripts/` population dropped), took 86 s locally, timed out
`scripts/api-compare/lint-detached-jsdoc-tags.test.ts:152` in Unit Tests and
aborted with exit 134 in Rails API/Test Comparison. Callers: `listLintedFiles`
(`scripts/api-compare/lint-detached-jsdoc-tags.ts:73-79`) and
`walkPackageTsFiles` in the same file.

TS-only tooling; no Rails counterpart.

## Acceptance criteria

- `walkTsFiles` does not descend into a `skipDirs` directory or follow a
  symlinked directory, so walking `scripts/` reads only `scripts/`'s own tree.
- A failure other than a missing directory is raised, not turned into an empty
  population.
- A test builds a directory with a symlink cycle under `node_modules` and
  asserts the walk returns the real files.
