---
title: "tasks finalize — assign an RFC number through the CLI"
status: draft
updated: 2026-06-11
rfc: "0000-tasks-cli-coverage"
cluster: rfc-commands
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`scripts/finalize-rfc.mjs` already renames `0000-<slug>` → `NNNN-<slug>`, rewrites
every `rfc:` reference + the H1, and rebuilds the indices. But it is a standalone
script, invoked by hand right before merge — and being skippable, it has already
been forgotten, landing a `0000-` placeholder on `main`. This story wires it in as
`tasks finalize` so it runs through the same commit/push machinery as every other
mutation.

## Acceptance criteria

- [ ] `tasks finalize <slug> [--dry-run]` runs the finalize logic and, unless
      `--dry-run`, commits the rename + rewritten refs + rebuilt indices via the
      standard `commitAndPush` loop (handling the dir rename in staging).
- [ ] Reuses `finalize-rfc.mjs`'s core (import or extract a shared function)
      rather than duplicating the rename/rewrite logic.
- [ ] `--dry-run` prints the planned `0000-` → `NNNN-` mapping and touched files,
      changing nothing.
- [ ] Errors clearly if the slug is not a `0000-` (or legacy `draft-`) placeholder
      or the dir is absent.

## Notes

Complements [[ci-guard-no-placeholder-on-main]]: this makes finalize easy; the
guard makes skipping it impossible. Source: `scripts/finalize-rfc.mjs`.
