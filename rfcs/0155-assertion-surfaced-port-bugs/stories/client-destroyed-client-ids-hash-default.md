---
title: "Client.destroyedClientIds is a bare Map where Rails is a defaulting Hash"
status: draft
updated: 2026-09-20
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Client.destroyed_client_ids` is a Hash with a default block in Rails
(`vendor/rails/activerecord/test/models/company.rb:187-189`):

```ruby
def self.destroyed_client_ids
  @destroyed_client_ids ||= Hash.new { |h, k| h[k] = [] }
end
```

so every call site reads it directly — `assert_equal [], Client.destroyed_client_ids[firm.id]`
(`vendor/rails/activerecord/test/cases/associations/has_many_associations_test.rb:1608,1644,1679,1688`).

trails declares it as a plain `Map` with no default
(`packages/activerecord/src/test-helpers/models/company.ts:392`):

```ts
static destroyedClientIds: Map<number, number[]> = new Map();
```

A `Map.get` on an absent key answers `undefined`, not `[]`, so the ports merged in trails#7902
each carry a `?? []` the Ruby has no counterpart for:

```ts
expect(Client.destroyedClientIds.get(firm.id as number) ?? []).toEqual([]);
```

That is four call sites in
`packages/activerecord/src/associations/has-many-associations.test.ts` (`clearing an association
collection`, `clearing a dependent association collection`, and twice in `clearing an
exclusively dependent association collection`), and the writer at `company.ts:454` carries the
matching `if (!...has(firmId)) ...set(firmId, [])` that Ruby's default block makes unnecessary.

## Converged shape

`destroyedClientIds` answers `[]` for an unseen key, the way Ruby's `Hash.new { |h, k| h[k] = [] }`
does, so the reader is `Client.destroyedClientIds.get(firm.id)` with no `?? []` and the writer is
a bare `.push`. ruby-compat's Hash is the likely vehicle; a `Map` subclass overriding `get` also
works.

## Acceptance criteria

- `Client.destroyedClientIds` returns an empty array for a key never written, mirroring
  `company.rb:187-189`.
- The four `?? []` reads in `has-many-associations.test.ts` are removed and the tests still pass.
- The `has`/`set` guard at `company.ts:454` is reduced to the `<<` the Ruby performs.
