---
title: "New workspace package needs three website vite aliases and nothing guards it"
status: closed
updated: 2026-08-17
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by make-new-package-registration-self-maintaining (2026-08-17 sweep): merged with guides-typecheck-package-coverage-self-maintaining. All three website vite config files verified still hand-maintained; citations carried forward."
---

## Context

A new workspace package must be registered in more places than any one checklist
names, and the misses are invisible to `pnpm typecheck`. #6139 added
`packages/date` and hit one that is documented nowhere: the docs site resolves
workspace packages by **vite alias**, not by their `exports` map, so a new
package needs a row in all three of

- `packages/website/vite.config.ts`
- `packages/website/vite.sw.config.ts`
- `packages/website/vitest.config.ts`

Without them the Website job fails at bundle time with
`[commonjs--resolver] Failed to resolve entry for package "@blazetrails/date".
The package may have incorrect main/module/exports specified in its package.json`
— a message that points at the new package's `package.json` rather than at the
missing alias, which is what made it cost a CI round.

Two existing checklists already live in CLAUDE.md / memory (a new cross-package
subpath needs the vitest alias + both dx-test tsconfigs; a new `scripts/` test
dir needs `vitest.config` + `ci.yml` filter + `UNIT_TESTS_PKGS_RE`). This lane
is a third and has no guard and no prose.

## Converged shape

A unit-tested guard, in the same family as `scripts/ci-suite-coverage.test.ts`,
that reads the `packages/*` workspace listing and asserts every package which
any website config aliases at all is aliased in **all three** website configs —
or, stronger and probably simpler, that every workspace package under
`packages/` (excluding `website` itself and the non-bundled ones) has a row in
each. Failure message must name the three files and the missing package.

No Rails counterpart — this is repo infrastructure, so it belongs to the
verification-tooling RFC rather than a fidelity one.

## Acceptance criteria

- [ ] A test fails when a workspace package is added without its three website
      alias rows, and names all three files in the failure message.
- [ ] The test passes on current `main` (all existing packages registered).
- [ ] Registered in the three places a new `scripts/` test needs if it lands in
      a new dir (`vitest.config` + `ci.yml` filter + `UNIT_TESTS_PKGS_RE`);
      otherwise placed in an already-registered dir.
- [ ] The website-alias lane is added to the new-package checklist prose in
      `CLAUDE.md`.
