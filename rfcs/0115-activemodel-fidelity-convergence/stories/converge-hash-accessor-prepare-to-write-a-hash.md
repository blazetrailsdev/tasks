---
title: "converge-hash-accessor-prepare-to-write-a-hash"
status: done
updated: 2026-08-29
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: 17
pr: 7192
claim: "2026-08-28T23:28:33Z"
assignee: "rehome-store-accessors-module-and-local-stored-attributes"
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Store::HashAccessor.prepare`
(`vendor/rails/activerecord/lib/active_record/store.rb:180-182`) is

```ruby
def self.prepare(object, attribute)
  object.public_send :"#{attribute}=", {} unless object.send(attribute)
end
```

— it writes an empty **Hash**. trails writes the _string_ `"{}"` instead
(`packages/activerecord/src/store.ts:182`), and then carries a
`StringKeyedHashAccessor.prepare` override
(`store.ts:243-252`) whose own comment says Rails has no such override and that
it exists only because the base writes a string the hstore parser rejects. Rails'
`StringKeyedHashAccessor` (`store.rb:203-211`) overrides `read` and `write`
only.

So one deviation (a string where Rails writes a hash) is being compensated by a
second (an override Rails does not have), and the second is self-documented as
existing for the first.

Surfaced while rehoming `store` / `store_accessor` as class methods
(PR #7187) — the accessors sit in the same file and were read end to end.

## Converged shape

`HashAccessor.prepare` writes `{}`, matching store.rb:181, and
`StringKeyedHashAccessor`'s `prepare` override is deleted so the class overrides
exactly the two methods Rails overrides. Whatever the text-backed store column
needs from the string form is the coder's job (`IndifferentCoder#dump`), not
`prepare`'s.

## Acceptance criteria

- [ ] `HashAccessor.prepare` writes an empty hash, not `"{}"`.
- [ ] `StringKeyedHashAccessor` defines `read` and `write` only.
- [ ] The hstore and json store suites stay green on all three lanes
      (`adapters/postgresql/hstore.test.ts`, `cases/json-shared-test-cases.ts`,
      `store.test.ts`).
