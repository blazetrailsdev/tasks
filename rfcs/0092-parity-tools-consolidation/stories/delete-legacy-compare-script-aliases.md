---
title: "delete-legacy-compare-script-aliases"
status: ready
updated: 2026-08-10
rfc: "0092-parity-tools-consolidation"
cluster: null
packages: []
deps:
  - sweep-legacy-script-spellings-in-the-tasks-repo
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`retire-legacy-compare-script-aliases` (#6305) removed every in-repo _reference_
to the legacy compare-script names — docs, JSDoc, comments, `.github/**`,
`eslint*`, `scripts/**`, `packages/**`, `vendor/{README.md,fetch.ts,sources.ts}`,
`scripts/api-compare/gate-regen.ts` (+ its test), and the generated
`docs/ruby-ts-conventions.md`. Nothing in the repo spells an old name any more
except three intentional historical mentions (the two "these are deprecated"
notes in `CLAUDE.md` and `scripts/parity/README.md`, and `api:calls:wide` in
`docs/infrastructure/prism-codegen-spike.md`, a script RFC 0084 deleted).

The 24 delegating alias entries themselves were deliberately KEPT in the root
`package.json` (one contiguous block after `parity:pipeline:query`): out-of-repo
callers — btwhooks task prompts, agent memory, running sessions, muscle memory —
still invoke them, and breaking those before usage has actually died out trades
a tidy `package.json` for a wave of "command not found" reds. Killing usage
first was the explicit call.

Aliases: `api:compare`, `api:drift`, `api:extra`, `api:build`, `api:reasons`,
`api:detached`, `api:calls`, `api:calls:report`, `api:calls:unreviewed`,
`api:calls:reseed`, `api:arity`, `api:inheritance`, `api:pins`, `api:pins:all`,
`api:moves`, `api:conventions`, `lint:deps`, `test:compare`,
`test:assertions:ratchet`, `test:assertions:ratchet:reseed`, `test:stubs`,
`fixtures:compare`, `schema:compare`, `schema:compare:reseed`.

## Acceptance criteria

- Confirm no out-of-repo caller still invokes a legacy name: btwhooks prompt
  templates, `~/.claude/**` memory files, and the tasks repo (`rfcs/**`).
  Update any that do.
- Re-run the in-repo sweep to confirm no reference regressed back in.
- Delete the alias block from the root `package.json`.
- Reword the two deprecation notes (`CLAUDE.md` "Before you open the PR" intro,
  `scripts/parity/README.md:5`) to say the aliases are gone.
