---
title: "activerecord: Persistence#increment / increment! read and write through self[] and public_send, not resolveAttributeAlias"
status: ready
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8418, which converged `increment!`'s arms but left its body's reads as they were.

Rails (`vendor/rails/v8.0.2/activerecord/lib/active_record/persistence.rb:632-636` and `:644-650`):

```ruby
def increment(attribute, by = 1)
  self[attribute] ||= 0
  self[attribute] += by
  self
end

def increment!(attribute, by = 1, touch: nil)
  increment(attribute, by)
  change = public_send(attribute) - (public_send(:"#{attribute}_in_database") || 0)
  self.class.update_counters(id, attribute => change, touch: touch)
  public_send(:"clear_#{attribute}_change")
  self
end
```

`packages/activerecord/src/persistence.ts`:

- `increment` resolves the name through an invented module-private `resolveAttributeAlias`, then
  writes `Number(readAttribute(name)) || 0` plus `by` through `writeAttribute`. Rails reads and
  writes through `self[]` / `self[]=` with `||= 0`, and resolves an alias through `[]`'s own
  attribute-alias handling.
- `incrementBang` calls `resolveAttributeAlias` again, reads `Number(readAttribute(attribute))`
  and `Number(attributeInDatabase(attribute)) || 0`, and clears through
  `clearAttributeChange(attribute)`. Rails sends the generated `attribute`,
  `attribute_in_database` and `clear_attribute_change` methods through `public_send`, so an alias
  and a user override of those methods are honoured.

## Acceptance criteria

- [ ] `resolveAttributeAlias` is deleted.
- [ ] `increment` is `self[attribute] ||= 0; self[attribute] += by; self` through the record's
      `[]` / `[]=` ports, with Ruby `||=` truthiness.
- [ ] `incrementBang` reads and clears through `rbFPublicSend` on the generated method names, with
      no `Number()` coercion Rails does not have.
- [ ] `persistence.test.ts` increment / decrement tests and `counter-cache.test.ts` stay green.

## Verification

```bash
pnpm vitest run packages/activerecord/src/persistence.test.ts packages/activerecord/src/counter-cache.test.ts
pnpm parity:api --calls && pnpm parity:api:calls && pnpm parity:api:calls:args
```
