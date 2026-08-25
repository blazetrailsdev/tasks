---
title: "delete-legacy-compare-script-aliases"
status: closed
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
closed-reason: "saving for much later"
---

## Context

`retire-legacy-compare-script-aliases` (#6305) removed every in-repo _reference_
to the legacy compare-script names — docs, JSDoc, comments, `.github/**`,
`eslint*`, `scripts/**`, `packages/**`, `vendor/{README.md,fetch.ts,sources.ts}`,
`scripts/api-compare/gate-regen.ts` (+ its test), and the generated
`docs/ruby-ts-conventions.md`. Nothing in the repo spells an old name any more
except three intentional historical mentions (the two "these are deprecated"
notes in `CLAUDE.md` and `scripts/parity/README.md`, and the wide call gate in
`docs/infrastructure/prism-codegen-spike.md`, a script RFC 0084 deleted).

The 24 delegating alias entries themselves were deliberately KEPT in the root
`package.json` (one contiguous block after `parity:pipeline:query`): out-of-repo
callers — btwhooks task prompts, agent memory, running sessions, muscle memory —
still invoke them, and breaking those before usage has actually died out trades
a tidy `package.json` for a wave of "command not found" reds. Killing usage
first was the explicit call.

The aliases are not enumerated here: this repo's story bodies were swept free of
the legacy spellings by `sweep-legacy-script-spellings-in-the-tasks-repo`, and
re-listing them would put them straight back. The authoritative list is the
alias block itself in the root `package.json`, and the stems the gate matches
are `LEGACY_SCRIPT_NAMES` in `scripts/parity/legacy-script-names.ts`.

**Prerequisite:** `sweep-legacy-script-spellings-in-the-tasks-repo` must land
first (it is already in this story's `deps`). Until it does, thousands of story
bodies name commands that stop working the moment the alias block is deleted,
and an agent copy-pasting one reads the failure as a broken environment.

## Acceptance criteria

- Confirm no out-of-repo caller still invokes a legacy name: btwhooks prompt
  templates, `~/.claude/**` memory files, and the tasks repo (`rfcs/**`).
  Update any that do.
- Re-run the in-repo sweep to confirm no reference regressed back in.
- Delete the alias block from the root `package.json`.
- Reword the two deprecation notes (`CLAUDE.md` "Before you open the PR" intro,
  `scripts/parity/README.md:5`) to say the aliases are gone.
