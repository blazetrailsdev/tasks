---
title: "ruby-compat: IO statics' PERMANENT receipts carry prose"
status: draft
updated: 2026-11-22
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/ruby-compat/lib/io.ts` (around lines 603-633) carries `@noRailsEquivalent PERMANENT — Ruby core ...` receipts with trailing prose on `IO::SEEK_SET`, `SEEK_CUR`, `SEEK_END` (`vendor/ruby/v3.3.11/io.c:15506-15510`) and `IO::NULL` (`file.c:6540`). Root CLAUDE.md, "Fidelity is the job": a `PERMANENT` receipt is the token alone. The reviewer on trails#10560 flagged the same shape on `IO.consoleSize`, which was converged there.

## Acceptance criteria

- Each of those receipts is the bare `@noRailsEquivalent PERMANENT`, and any MRI citation moves into the JSDoc description.
- `no-freeform-comments` reports nothing for `io.ts`.
