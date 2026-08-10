---
title: "Move conventions-doc.ts next to its source in @blazetrails/parity"
status: done
updated: 2026-08-09
rfc: "0092-parity-tools-consolidation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6275
claim: "2026-08-09T02:30:47Z"
assignee: "converge-check-constraint-name-fetch-semantics"
blocked-by: null
closed-reason: null
---

## Context

`extract-parity-tools-package` (PR #6253) moved `conventions.ts` into
`@blazetrails/parity`, but left its only consumer-generator behind:

- `scripts/api-compare/conventions-doc.ts` imports nothing from api-compare
  any more — its single import is `explainConventions` from
  `@blazetrails/parity/conventions`.
- `package.json:49` (`parity:api:conventions`) and the CI check step
  (`.github/workflows/ci.yml:1448`,
  `pnpm exec tsx scripts/api-compare/conventions-doc.ts --check`) both name the
  api-compare path.
- The generated header inside `explainConventions()`
  (`scripts/parity/conventions.ts:1073`) names both paths, so it has to be
  regenerated with the move.

The file is a doc generator over a parity module and belongs next to its
source, matching the RFC 0092 arc of making `@blazetrails/parity` the home of
the compare core.

Not a Rails deviation — infra-only, no Ruby counterpart.

## Acceptance criteria

- `git mv scripts/api-compare/conventions-doc.ts scripts/parity/`; import
  becomes a sibling-relative `./conventions.js`.
- `package.json` `parity:api:conventions` and the ci.yml `--check` step point at the
  new path.
- `pnpm parity:api:conventions` regenerates `docs/ruby-ts-conventions.md` with the
  updated header, and `--check` is clean.
- Grep the repo for `scripts/api-compare/conventions-doc.ts` and repoint any
  prose references (CONTRIBUTING.md:246 at time of writing).
