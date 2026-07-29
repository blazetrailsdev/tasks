---
title: "preventing_writes? must return false when connection_descriptor is nil"
status: claimed
updated: 2026-07-29
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-07-29T22:31:58Z"
assignee: "preventing-writes-nil-connection-descriptor"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in review on PR #5544 (story
`while-preventing-writes-non-sqlite-adapters`, RFC 0005).

Rails' `AbstractAdapter#preventing_writes?` has three branches
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:227-232`):

```ruby
def preventing_writes?
  return true if replica?
  return false if connection_descriptor.nil?

  connection_descriptor.current_preventing_writes
end
```

The middle branch is the one trails is missing. `isPreventingWrites` in
`packages/activerecord/src/connection-adapters/abstract-adapter.ts:1415` goes
straight from the replica/pool checks to walking `connectedToStack()`, and any
entry whose `klasses` include `Base` returns its `preventWrites` flag —
`ownerName` (read from `pool?.poolConfig?.connectionDescriptor?.name`) being
`undefined` never short-circuits.

Consequence: a standalone adapter with no pool/descriptor — `new
BetterSQLite3Adapter(":memory:")`, every bare-adapter test — is blocked by an
ambient `Base.whilePreventingWrites` scope, where Rails would let the write
through. PR #5544 hit this in
`packages/activerecord/src/adapters/sqlite3/sqlite3-adapter-perform-query.trails.test.ts`:
two cases asserted a `Base` scope reached a standalone `:memory:` adapter. They
were changed to lease a pooled connection instead, which sidesteps the
divergence but does not fix it.

## Acceptance criteria

- [ ] `isPreventingWrites` returns `false` when there is no connection
      descriptor, before consulting `connectedToStack()`, matching
      `abstract_adapter.rb:229`. The `replica?` branch still wins over it.
- [ ] A regression test covers the standalone-adapter case: a bare adapter is
      NOT prevented by an ambient `Base.whilePreventingWrites` scope. It must
      fail on baseline.
- [ ] Audit callers that currently rely on the blanket behaviour — the
      `connectedToStack` walk is also what `base-prevent-writes.test.ts`
      exercises through pooled models, which must keep passing.
- [ ] `api:compare` and `test:compare` deltas >= 0.
