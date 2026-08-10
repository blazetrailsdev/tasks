---
title: "Sweep legacy compare-script spellings out of the tasks repo's story bodies"
status: done
updated: 2026-08-10
rfc: "0092-parity-tools-consolidation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6347
claim: "2026-08-10T19:18:57Z"
assignee: "ar-closure-rollup-in-parity-summaries"
blocked-by: null
closed-reason: null
---

## Context

PR 6338 added the `parity:legacy-names` gate
(`scripts/parity/lint-legacy-script-names.ts`, a step in the
`Rails API/Test Comparison` job). Its first CI run reported 3813 hits under
`tasks/` — the work-tracking repo `start-worktree.sh` places inside the
worktree — so `tasks` is in `SKIPPED_DIRS`
(`scripts/parity/legacy-script-names.ts`) with the reason recorded there.

That exclusion is right for the gate (another repo's history is not a reference
trails can fix) but it leaves the harm the gate exists to prevent. Story bodies
are read by agents and copy-pasted verbatim: once
`delete-legacy-compare-script-aliases` lands, every legacy compare-script
spelling in a story body becomes a broken command an agent will run,
and the failure will look like a broken environment rather than stale prose.

Concentrations seen in the CI output: `tasks/index.md` (7 references),
`rfcs/0004-query-cache-mixin/`, `rfcs/0005-activerecord-gaps/`, and most
story bodies old enough to predate RFC 0092.

## Converged shape

A one-pass sweep in the TASKS repo (not trails), same token list the gate
already spells: `LEGACY_SCRIPT_NAMES` in
`scripts/parity/legacy-script-names.ts`, each mapped to its `parity:*` name per
`scripts/parity/README.md`. Closed stories are prose about past work and can be
swept mechanically; the mapping is one-to-one with no judgement calls.

Sequencing: this should land BEFORE `delete-legacy-compare-script-aliases`, so
no story body names a command that has stopped working.

## Acceptance criteria

- [ ] No legacy compare-script spelling remains in the tasks repo.
- [ ] `delete-legacy-compare-script-aliases` notes this as a prerequisite.
- [ ] No change to the gate's population — `tasks/` stays skipped in trails.
