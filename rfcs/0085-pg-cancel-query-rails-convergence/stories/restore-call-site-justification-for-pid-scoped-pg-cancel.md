---
title: "pid-scoped pg_cancel_backend deviation is justified only in the PR body, not at the call site"
status: draft
updated: 2026-07-27
rfc: "0085-pg-cancel-query-rails-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 5
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/adapters/postgresql/transaction.test.ts`
"raises QueryCanceled when canceling statement due to user request"
deliberately deviates from Rails.

Rails
(`vendor/rails/activerecord/test/cases/adapters/postgresql/transaction_test.rb:156-179`)
cancels the blocked backend by **query pattern**:

```sql
SELECT pg_cancel_backend(pid) FROM pg_stat_activity
WHERE state = 'active' AND query LIKE '% FOR UPDATE'
```

Rails is single-process, so the pattern can only match its own session. trails
forks 6 workers onto one shared CI database, where the same pattern matches —
and cancels — a **sibling worker's** in-flight `FOR UPDATE`. PR #5437
therefore switched to capturing `pg_backend_pid()` from the `other` connection
and cancelling that pid, plus a `pg_stat_activity` poll on that same pid to
prove a real `FOR UPDATE` was blocked before cancelling.

The deviation is sound and was accepted in review. **The problem is where it
is written down:** the justification lives only in the #5437 PR body. The
call-site comments explaining it were stripped at the author's explicit
request during that PR, which conflicts with the repo convention that
deviations are justified at the call site, not in a PR body — a future reader
of this test sees pid-scoped cancellation with no hint that Rails does it
differently or why, and may "converge" it straight back into the CI flake.

## Acceptance criteria

- A short call-site comment on the cancel records the deviation: Rails
  pattern-matches `pg_stat_activity`; trails scopes to its own pid because the
  CI database is shared across workers.
- No behavior change — comment only.
- Confirm with the author first, since the comment removal was a deliberate
  instruction on #5437 and this reverses it.
