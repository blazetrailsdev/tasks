---
title: "ensure_valid_options_for_batching!'s other three guards raise a bare Error, not ArgumentError"
status: draft
updated: 2026-08-17
rfc: "0111-error-class-message-parity"
cluster: bare-error-throws
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

`ensure_valid_options_for_batching!`
(`vendor/rails/activerecord/lib/active_record/relation/batches.rb:305-326`)
raises `ArgumentError` from all four of its guards. PR #6646 converged the
`:order` guard (batches.rb:323-325) onto `ArgumentError`, but left the other
three throwing a bare JS `Error` in
`packages/activerecord/src/relation/batches.ts`
(`ensureValidOptionsForBatchingBang`):

- `:start must contain one value per cursor column` — batches.rb:306-308
- `:finish must contain one value per cursor column` — batches.rb:310-312
- `:cursor must include a primary key or other unique column(s)` — batches.rb:314-321

`ArgumentError` is already imported into the file (from
`@blazetrails/activemodel`) by #6646, so each is a one-token change. A caller
rescuing `ArgumentError` around `in_batches` — which is what Rails' own
`batches_test.rb` does — cannot distinguish these three today.

## Acceptance criteria

- [ ] All three remaining throws in `ensureValidOptionsForBatchingBang` raise
      `ArgumentError`, matching batches.rb:306, :310 and :320.
- [ ] Message strings unchanged (they already match Rails verbatim).
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.

## Re-homed from `0023-surfaced-deviations` (2026-08-18)

Moved by the RFC 0023 backlog triage pass into `0111-error-class-message-parity`, which was carved out
of that register for this deviation class. Nothing about the finding changed —
every Rails and trails `file:line` citation above is as originally filed.
