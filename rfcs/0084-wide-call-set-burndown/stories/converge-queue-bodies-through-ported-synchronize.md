---
title: "ConnectionPool::Queue bodies inline what Rails wraps in the already-ported synchronize"
status: done
updated: 2026-08-09
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6279
claim: "2026-08-09T13:39:33Z"
assignee: "check-constraint-name-raises-argumenterror-not-keyerror"
blocked-by: null
closed-reason: null
---

## Context

`ConnectionPool::Queue#synchronize`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/connection_pool/queue.rb:80-82`)
is already ported faithfully as a pass-through in
`packages/activerecord/src/connection-adapters/abstract/connection-pool/queue.ts`
(around `:358`), carrying a `Mirrors:` JSDoc line:

```ts
synchronize(_queue, block) { return block(); }
```

**Nothing calls it.** The four Ruby bodies that wrap themselves in
`@lock.synchronize` — `add`, `clear`, `poll`, `num_waiting` (plus
`any_waiting?`, `delete`, `with_a_bias_for`) — inline their work in the port, so
each shows up as a `call-mismatches-exclude` row for the `synchronize` call:
`scripts/api-compare/call-mismatches-exclude/activerecord/connection-adapters/abstract/connection-pool/queue.json`
(7 rows).

This is the one sub-slice of the 2026-08-08 mutex audit that CONVERGES rather
than taking a class reason, which is why PR #6275's `mutex-sync-body`
`--set-reason` category deliberately excludes the queue.ts rows (see
`REASON_CATEGORIES` in `scripts/api-compare/lint-call-mismatches.ts`).

## Converged shape

Each Ruby body that opens with `synchronize do ... end` routes its body through
the existing pass-through, exactly as `queue.rb` writes it — e.g. `queue.rb:36`

```ruby
def add(element)
  synchronize do
    @queue.push element
    ...
  end
end
```

becomes a `this.synchronize(this._queue, () => { ... })` call with the same body.
No new abstraction, and the pass-through's signature does not change.

## Acceptance criteria

- [ ] Every `queue.ts` body whose Ruby counterpart wraps itself in
      `synchronize` calls the ported `synchronize`, with Rails' body inside.
- [ ] The `synchronize` rows in
      `call-mismatches-exclude/activerecord/connection-adapters/abstract/connection-pool/queue.json`
      are DELETED (only-shrink), not reworded; delete the shard file if it empties.
- [ ] `pnpm parity:api:calls` green with the marks reseeded (`pnpm parity:api:calls:reseed` or
      the reviewable hand-edit).
- [ ] SQLite, MySQL and PostgreSQL lanes green.
