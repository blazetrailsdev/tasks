---
title: "AbstractAdapter's constructor is zero-arg where Rails' initialize takes config"
status: draft
updated: 2026-07-30
rfc: "0094-sqlite3-adapter-construction-fidelity"
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

Surfaced by PR #5669 (`converge-fake-adapter-superclass-onto-abstract-adapter`).

Rails' `AbstractAdapter#initialize` takes the adapter's config/connection
argument list
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:125`:
`def initialize(config_or_deprecated_connection, deprecated_logger = nil,
deprecated_connection_options = nil, deprecated_config = nil)`).

trails' `AbstractAdapter` constructor is zero-arg
(`packages/activerecord/src/connection-adapters/abstract-adapter.ts:711`:
`constructor() {`). Config reaches the instance by another route.

The gap is observable in the fake adapter. Rails'
`test/support/fake_adapter.rb:11-16` is `def initialize(...)` + a bare `super`,
forwarding the whole argument list up. The port
(`packages/activerecord/src/support/fake-adapter.ts`) cannot express that: with
nothing to forward, its constructor is zero-arg and the `super()` call is
argumentless. The same shape recurs in every adapter subclass constructor.

## Acceptance criteria

- Either `AbstractAdapter`'s constructor accepts Rails' config argument and
  subclasses forward to it, or the zero-arg shape is recorded as a reasoned
  deviation at `abstract-adapter.ts:711` stating how config reaches the
  instance instead and why the Rails signature is not portable.
- Adapter subclass constructors (`sqlite3`, `postgresql`, `mysql2`, the fake)
  agree with whichever shape is chosen — no mix of forwarding and zero-arg.
- `pnpm parity:api` arity for `AbstractAdapter#initialize` does not regress.
