---
title: "Drop the now-false order:-row migration warning from the six wave-5 follow-up stories"
status: ready
updated: 2026-08-22
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #6855 fixed the `order:`-row migration trap: `compare.ts`'s `checkCalls`
appended the order-only flags AFTER `@missingRailsCall` tag suppression ran, so
a tag migrated from an `order:` baseline row suppressed nothing and the gate
reported that one row's call twice at once — as a STALE tag and as a NEW
mismatch. `applyCallTags` now applies a declaration's tags to every flag its
pair raised, and the sqlite3 `copy_table` / `order:columns,createTable` row was
migrated to a call-site receipt as the end-to-end proof.

Before that fix, PR #6849 worked around the trap by leaving the row baselined,
and wrote a warning about it into the six RFC 0106 wave-5 follow-up stories
(`wave-5b-head-sweep` … `wave-5-tail-sweep`) so a later sweep would not
rediscover it.

Those warnings are now false. An `order:` row migrates like any other row, and a
sweep that skips one on their advice leaves convergeable debt baselined for no
reason.

## Converged shape

Drop the `order:`-trap paragraph from each of the six wave-5 follow-up story
bodies, citing PR #6855. Story-body edits only — no code.

## Acceptance criteria

- [ ] The `order:`-trap warning is removed from all six wave-5 follow-up stories.
- [ ] No other guidance in those bodies is altered.
