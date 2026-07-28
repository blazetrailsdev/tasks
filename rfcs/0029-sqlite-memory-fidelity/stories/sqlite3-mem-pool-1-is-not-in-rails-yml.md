---
title: "sqlite3_mem pins pool: 1, which config.example.yml does not — converge or record the deviation"
status: draft
updated: 2026-07-28
rfc: "0029-sqlite-memory-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/support/connection.ts:155-172` builds the
`sqlite3_mem` connection as
`{ adapter: "sqlite3", database: ":memory:", pool: 1 }` for both `arunit` and
`arunit2`.

Rails' `vendor/rails/activerecord/test/config.example.yml:93-98` has **no
`pool:` key** on either entry — they are just `adapter` + `database`. The
`pool: 1` is a trails invention, currently justified in a call-site comment
added by PR #5508 and asserted by
`support/connection.test.ts:137` ("pins pool 1 on the sqlite3_mem :memory:
connection").

The rationale is real: a `:memory:` database belongs to its connection, so a
second pool member is silently a second, EMPTY database. Rails never trips on
this because its suite checks out one connection at a time; our pool leases
concurrently. But per `feedback_deviation_stories_always_converge`, an
invention that diverges from the vendored yml should either converge or carry
a recorded, deliberate deviation rather than living only as a comment.

Known consequence, surfaced by #5508: `pooled-test-adapter.test.ts`'s
`pinConnectionBang + write + unpinConnectionBang rolls back` case needs two
connections and therefore raises `ConnectionTimeoutError` on this lane; it is
now `it.skipIf(inMemoryDb())`. That skip exists ONLY because of this
deviation — if `pool: 1` goes away or is replaced by a shared-cache mechanism,
re-derive the skip.

## Acceptance criteria

- [ ] Decide: converge to Rails (drop `pool:`, accept the default) or keep the
      deviation with a recorded justification in the deviation ledger rather
      than only a code comment.
- [ ] If converging, establish what makes a multi-connection `:memory:` pool
      safe (SQLite shared-cache / `file::memory:?cache=shared` is the usual
      answer) and confirm the AR suite stays green under
      `ARCONN=sqlite3_mem`.
- [ ] Re-derive the `it.skipIf(inMemoryDb())` on
      `pooled-test-adapter.test.ts` — it is downstream of this choice.
- [ ] `support/connection.test.ts:137` reflects whatever the outcome is.
