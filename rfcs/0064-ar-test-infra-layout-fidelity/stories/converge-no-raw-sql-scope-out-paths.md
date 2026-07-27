---
title: "Converge no-raw-sql scope-out paths onto a single source of truth"
status: ready
updated: 2026-07-27
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`eslint/no-raw-sql.mjs` hardcodes its scope-out paths as regexes in
`isExcluded()` (`test-helpers/`, `support/`, `test-setup-*.ts`, and now
`cases/helper.ts`), while `eslint.config.mjs` separately lists the same paths as
globs in the `blazetrails/no-raw-sql` block. The two lists must be edited
together, and nothing enforces that.

This bit PR #5395 (rename `test-setup-ar.ts` → `cases/helper.ts`): the new path
stopped matching `/(^|\/)test-setup-[^/]*\.ts$/`, so the file would have started
failing `no-raw-sql` on a pure rename. It was caught only because the story's
acceptance criteria happened to call it out by `file:line`. Every remaining file
move in RFC 0064 (`support-adapter-helper`, `support-load-schema-helper`,
`port-missing-support-helpers`, `disposition-remaining-test-helpers`) walks into
the same landmine, and a miss is silent until CI lint runs.

Relevant code:

- `eslint/no-raw-sql.mjs:35-46` — `isExcluded()` regex list.
- `eslint.config.mjs:478-490` — the parallel glob list.

## Acceptance criteria

- Single source of truth for the no-raw-sql scope-out paths: either the rule
  reads the exclusions from config (options/settings) instead of hardcoding
  them, or both lists derive from one shared exported constant.
- Renaming or moving a scoped-out test-infra file requires editing exactly one
  place.
- Existing scope-outs keep their current effective behavior — this is a
  refactor, not a change to which files are linted. Verify by confirming the
  set of files reported by `no-raw-sql` is unchanged before/after.
- No new third-party deps.
