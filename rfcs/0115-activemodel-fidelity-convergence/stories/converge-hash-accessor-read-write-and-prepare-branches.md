---
title: "Converge HashAccessor's read/write helpers and prepare's extra branch to Rails"
status: done
updated: 2026-08-29
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: 23
pr: 7217
claim: "2026-08-29T22:14:49Z"
assignee: "converge-hash-accessor-read-write-and-prepare-branches"
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Store::HashAccessor` has exactly three one-line class methods
(`vendor/rails/activerecord/lib/active_record/store.rb:178-190`):

```ruby
def self.read(object, attribute, key)
  prepare(object, attribute)
  object.public_send(attribute)[key]
end

def self.write(object, attribute, key, value)
  prepare(object, attribute)
  object.public_send(attribute)[key] = value if value != read(object, attribute, key)
end

def self.prepare(object, attribute)
  object.public_send :"#{attribute}=", {} unless object.send(attribute)
end
```

trails (`packages/activerecord/src/store.ts`) carries two extra deviations that
`converge-hash-accessor-prepare-to-write-a-hash` (PR #7192) did not touch — that
story converged only the `"{}"`-vs-`{}` write and the
`StringKeyedHashAccessor.prepare` override it was compensating for:

- `HashAccessor.prepare` has a second `else if` branch with no Rails counterpart
  — it re-wraps a plain-object value in a `HashWithIndifferentAccess` and writes
  it back. Rails' `prepare` is a single `unless` guard; the HWIA coercion is
  `IndifferentHashAccessor.prepare`'s job (store.rb:253-261).
- `_readHash` / `_writeHash` (`store.ts`, `protected static`) are trails-only
  helpers standing in for Ruby's `object.public_send(attribute)[key]`. Rails
  indexes the hash directly; the helpers exist to normalize a string / HWIA /
  plain-object value the reader should never see once the column type
  deserializes correctly.

Both compensate for store values reaching the accessor in shapes Rails' type
layer would already have resolved, so converging them likely means fixing where
the value is produced, not the accessor.

## Converged shape

`HashAccessor` is three methods: `read`, `write`, `prepare` — `prepare` is the
single `unless` guard (store.rb:181), and `read`/`write` index
`object.readAttribute(attribute)` directly, with `_readHash` / `_writeHash`
deleted. Whatever normalization the column value needs happens in the type /
coder, as it does in Rails.

## Acceptance criteria

- [ ] `HashAccessor.prepare` has one branch, matching store.rb:180-182.
- [ ] `_readHash` / `_writeHash` are gone and `read` / `write` mirror
      store.rb:179-186 line for line.
- [ ] `store.test.ts`, `cases/json-shared-test-cases.ts` and
      `adapters/postgresql/hstore.test.ts` green on all three lanes.
- [ ] `pnpm parity:api:extra --package activerecord` delta non-negative.
