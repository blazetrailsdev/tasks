---
title: "AbstractAdapter#role/#shard read through a cast that returns undefined where Ruby raises NoMethodError"
status: blocked
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: "2026-08-08T00:01:22Z"
assignee: "abstract-adapter-role-shard-cast-hides-ruby-nomethoderr"
blocked-by: "Criterion 1 (no pool-less adapter is read through role/shard/inspect) is the whole story and cannot land in one PR: the remaining sites are pool-less by design. Retyping the field was tried and rejected on PR #6207. Split into schema-conn-adapters-carry-a-real-pool, raw-test-and-second-connection-adapters-carry-a-real-pool, template-global-setup-adapters-carry-a-real-pool; delete the abstract-adapter.ts:1406-1416 cast once the last lands."
closed-reason: null
---

## Context

Shipped by PR #6195 (`retire-pool-less-adapters-and-delete-nullpool-role-shard`),
which deleted `NullPool#role` / `#shard` so `NullPool`'s members match
`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:14-51`.

`AbstractAdapter#role` / `#shard`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:286-296`)
are bare unchecked sends:

```ruby
def role
  @pool.role
end

def shard
  @pool.shard
end
```

Since `pool` is typed `NullPool | ConnectionPool` and `NullPool` no longer
answers either, the port reads through a cast
(`packages/activerecord/src/connection-adapters/abstract-adapter.ts:1406-1416`):

```ts
return (this.pool as ConnectionPool).role;
```

Ruby raises `NoMethodError` on a pool-less adapter; the cast returns
`undefined`. The failure mode diverges: a future pool-less construction site
would silently make an adapter look like a writing/default one instead of
failing loudly, and `inspect()` (`abstract_adapter.rb:174-181`) would render
`shard="undefined"` rather than raising. PR #6195 verified no current caller
reaches `role` / `shard` / `inspect()` on a pool-less adapter, and pinned the
`NullPool` member list with a `NullPool member parity` test in
`connection-pool.trails.test.ts`, but the cast's silent arm is unpinned.

The remaining pool-less construction sites are `test-adapter.ts:120,127,139`,
`support/schema-conn.ts:27-30`, `support/template-global-setup.ts:120,189,313`,
`support/second-connection.ts:20`, `tasks/mysql-database-tasks.ts:154,226`,
`tasks/sqlite-database-tasks.ts:279`, and `mysql2-adapter.ts:360`. (`create-and-migrate-adapters-carry-a-real-pool` owns the task/CLI subset;
this story owns closing the reader.)

## Converged shape

Once every adapter that is read through `role` / `shard` / `inspect()` is reached
through a real pool, `pool` narrows to `ConnectionPool` at those readers and both
bodies are the bare `this.pool.role` / `this.pool.shard` with no cast — the exact
`abstract_adapter.rb:286-296` one-liners. `AbstractAdapter`'s constructor default
`this.pool = new NullPool()` stays; it mirrors `abstract_adapter.rb:153`.

Do **not** close this by adding an `instanceof` guard that throws: that is a
branch Rails does not have in the method the call-parity gate reads. The
convergence is at the construction sites, not in the reader.

## Acceptance criteria

- [ ] No trails path constructs an adapter that outlives a pool and is then read
      through `role`, `shard` or `inspect()`, with the remaining sites from the
      list above routed through a real pool.
- [ ] `AbstractAdapter#role` / `#shard` are the bare `this.pool.role` /
      `this.pool.shard` with no cast (`abstract_adapter.rb:288,294`).
- [ ] The `NullPool member parity` test still passes; no test names change.

## Findings, 2026-08-07 (attempted on PR #6207, reverted before merge)

**Retyping the field is NOT a way to close this, and it was tried.** #6207
declared `pool: ConnectionPool` and moved the cast onto the `NullPool` seed at
`abstract_adapter.rb:153`'s port site, which does make the two readers bare —
acceptance criterion 2 — while changing nothing at runtime. Review blocked it,
correctly: `NullPool` still has no `role`/`shard` (`connection-pool.ts:112-130`),
`pool instanceof NullPool` still guards `close()` (`abstract-adapter.ts:1753`)
and `columnForAttribute` (`:2646`), so a pool-less adapter's `.role` still
returns `undefined`. Worse, the declared type then asserts `ConnectionPool` for
_every_ `this.pool.x` reader, so the next such reader gets no type-level signal
at all — it makes the failure mode this story exists to close **easier** to
introduce. The cast also multiplies rather than disappears: the seed, plus four
`Object.create`-built adapters in `abstract-mysql-adapter.test.ts`, plus a
downstream `dbConfig.envName as string` in `migration.ts:2597-2604` that has to
be dropped and would need restoring. Do not re-derive this arm.

**So criterion 1 is the whole story, and it is not ~180 LOC.** The construction
sites are not incidentally pool-less; several are pool-less _by design_ and a
real `ConnectionPool` is a behavioural change there, not a wiring change:

- `support/schema-conn.ts:27-30` builds an adapter that is deliberately
  **never connected** — it exists to render DDL for a dialect the lane isn't
  running. A `ConnectionPool` starts a `Reaper` and expects to open connections,
  so this site needs either a pool that never checks out or a different answer.
- `test-adapter.ts:120,127,139` is `newRawTestAdapter`, whose entire purpose is
  a _raw_ adapter outside the primary pool (each one caps its driver at a single
  server connection precisely because the outer pool multiplexes).
- `support/second-connection.ts:20` documents the deviation in its header: Rails
  uses `@connection.pool.checkout`; trails opens an independent adapter.
  Converging this one probably means porting the `pool.checkout` shape, which is
  its own story.
- `support/template-global-setup.ts:120,189,313` and the `tasks/*-database-tasks.ts`
  sites are the CLI/bootstrap subset; the task/CLI half is already owned by
  `create-and-migrate-adapters-carry-a-real-pool`.

Suggested re-scope: land `create-and-migrate-adapters-carry-a-real-pool` first,
then take the remaining test-support sites one at a time, and only delete the
reader cast once the last one is gone. Retyping the field ahead of that is
ratification wearing a convergence hat.
