---
title: "Node#toSql should borrow-and-return via with_connection, not hold a sync lease"
status: draft
updated: 2026-07-22
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #5036 (converge-node-tosql-to-table-engine-connection, merged).

Rails' `Arel::Nodes::Node#to_sql` and `TreeManager#to_sql` wrap the visit in
`engine.with_connection` (arel/nodes/node.rb:148-153, tree_manager.rb:53-58):

```ruby
def to_sql(engine = Table.engine)
  collector = Arel::Collectors::SQLString.new
  engine.with_connection { |connection| connection.visitor.accept(self, collector).value }
end
```

`with_connection` **borrows** a connection for the block and returns it to the
pool afterward. trails' `Node#toSql` (packages/arel/src/nodes/node.ts) instead
reads `engine.connection` synchronously:

```ts
const collector = new SQLString();
return engine.connection.visitor.accept(this, collector).value;
```

`engine.connection` (activerecord base.ts's `Table.engine` object →
`pool.activeConnection ?? pool.leaseConnectionSync()`) takes a _sync lease_ and
does not return the connection to the pool per call. Two consequences vs Rails:

1. Connection lifecycle: Rails borrows+returns each `to_sql`; trails leases and
   holds (can flip the lease permanent on first call).
2. It skips the async per-checkout `verifyBang` — the residual already accepted
   in `connection-pool-pinned-sync-checkout-per-checkout-verify` (done).

The reason it cannot use `with_connection` today: trails' `withConnection` is
async (per-checkout `verifyBang` is awaited), and `to_sql` is synchronous in
Rails and at 600+ trails call sites, so a sync `to_sql` cannot `await` it.

Convergence is therefore blocked on one of: (a) a synchronous `with_connection`
borrow/return path on the pool, or (b) making the Arel `toSql` surface async
(large — touches every call site). This story tracks the deviation for triage;
it is deliberately deferred, justified at the call site in node.ts.

## Acceptance criteria

- [ ] `Node#toSql` / `TreeManager#toSql` borrow-and-return a connection per call
      (Rails' `with_connection` semantics) rather than holding a sync lease — OR
      a decision is recorded that the sync lease is the permanent trails shape.
- [ ] No per-call permanent-lease flip introduced by `toSql` under
      `permanentConnectionCheckout != true`.
