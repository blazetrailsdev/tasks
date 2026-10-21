---
title: "Land the generated marcel package on main, registered in CI"
status: ready
updated: 2026-10-21
rfc: "0000-marcel-port-to-100"
cluster: marcel-land
packages: ["marcel"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The trails branch `marcel-port` (`3b165e0d11`) holds the generated marcel port:
`packages/marcel` (package.json, tsconfig.json, `src/`), the marcel entry in
`vendor/sources.ts` (v1.0.4, `compareApi: false`, `compareTests: false`), and
the gem's test fixtures at `packages/marcel/src/test-helpers/fixtures` (135
files, ~13 MB, byte-for-byte copies of `vendor/marcel/v1.0.4/test/fixtures`).
The fixtures are already exempt in `.gitattributes` (`binary`),
`eslint.config.mjs`, `.prettierignore` and `scripts/ci/check-control-bytes.sh`
(`BINARY_RE`). Locally `pnpm vitest run packages/marcel/src` gives 365 passed,
6 failed, 3 skipped.

What the branch does not yet have is CI: a new package needs its `ci.yml`
registrations, its place in the workspace and the root tsconfig references,
and the guard fixtures that enumerate packages (see the trails memory note on
new packages and `scripts/` guards that list them). `vendor/marcel` must also
reach CI the way the other non-Rails vendor sources do.

## Acceptance criteria

- A draft PR from `marcel-port` (rebased on `main`) lands `packages/marcel`,
  its vendor source and its fixtures.
- marcel is built and tested in CI like any other package; every guard that
  enumerates packages knows it.
- The 6 magic-byte failures are marked `it.fails` or skipped with a pointer to
  `marcel-magic-bytes-match-binary-io`, so `main` stays green; nothing else
  in the tree changes.
- The PR body states the starting numbers (tests, tsc errors) for the RFC's
  later stories to measure against.
