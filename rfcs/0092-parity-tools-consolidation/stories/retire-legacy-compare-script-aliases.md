---
title: "retire-legacy-compare-script-aliases"
status: done
updated: 2026-08-10
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
`parity:schema` + sub-commands) and left every old name — the legacy `api:*`,
`lint:*`, `test:*`, `fixtures:*` and `schema:*` compare spellings, enumerated
as `LEGACY_SCRIPT_NAMES` in `scripts/parity/legacy-script-names.ts` — as a
one-line delegating alias onto its `parity:*` counterpart. (The spellings are
not written out here: this repo's bodies were swept free of them by
`sweep-legacy-script-spellings-in-the-tasks-repo`.)

The aliases exist because `CLAUDE.md`, `CONTRIBUTING.md`, `docs/**`,
`.github/copilot-instructions.md`, dozens of JSDoc/comment strings under
`scripts/api-compare/**` and `scripts/test-compare/**`, btwhooks task prompts,
and agent memory all name the old scripts. `scripts/api-compare/gate-regen.ts`
spawns the compare entry point at runtime (`gate-regen.ts:49`), and
`gate-regen.test.ts:39,44` assert on that string.

## Acceptance criteria

- Every in-repo reference (docs, JSDoc, comments, `gate-regen.ts` +
  its test) names the `parity:*` script.
- ~~The alias entries are deleted from the root `package.json`.~~ **Descoped by
  maintainer decision (2026-08-09): kill usage first, delete the entries later.**
  The aliases stay as an undocumented deprecated shim so out-of-repo callers
  (btwhooks prompts, agent memory, running sessions) don't break before usage
  has actually died out. This story instead consolidates them into one
  contiguous block in the root `package.json` and documents them as deprecated
  in `CLAUDE.md` + `scripts/parity/README.md` — no doc, comment, script, or CI
  step may spell one. Their deletion is the follow-up story
  `delete-legacy-compare-script-aliases`, gated on confirming no out-of-repo
  caller is left.
- btwhooks prompt templates / agent-facing docs updated, or the removal
  deferred until they are.
