---
title: "retire-legacy-compare-script-aliases"
status: in-progress
updated: 2026-08-09
rfc: "0092-parity-tools-consolidation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6305
claim: "2026-08-09T23:04:31Z"
assignee: "retire-legacy-compare-script-aliases"
blocked-by: null
closed-reason: null
---

## Context

PR for `parity-script-namespace` introduced the `parity:*` script namespace in
the root `package.json` (`parity:api`, `parity:test`, `parity:fixtures`,
`parity:schema` + sub-commands) and left every old name — `api:compare`,
`api:drift`, `api:extra`, `api:build`, `api:reasons`, `api:detached`,
`api:calls*`, `api:arity`, `api:inheritance`, `api:pins*`, `api:moves`,
`api:conventions`, `lint:deps`, `test:compare`, `test:assertions:ratchet*`,
`test:stubs`, `fixtures:compare`, `schema:compare*` — as a one-line delegating
alias (`"api:compare": "pnpm parity:api"`).

The aliases exist because `CLAUDE.md`, `CONTRIBUTING.md`, `docs/**`,
`.github/copilot-instructions.md`, dozens of JSDoc/comment strings under
`scripts/api-compare/**` and `scripts/test-compare/**`, btwhooks task prompts,
and agent memory all name the old scripts. `scripts/api-compare/gate-regen.ts`
spawns `pnpm api:compare` at runtime (`gate-regen.ts:49`), and
`gate-regen.test.ts:39,44` assert on that string.

## Acceptance criteria

- Every in-repo reference (docs, JSDoc, comments, `gate-regen.ts` +
  its test) names the `parity:*` script.
- The alias entries are deleted from the root `package.json`.
- btwhooks prompt templates / agent-facing docs updated, or the removal
  deferred until they are.
