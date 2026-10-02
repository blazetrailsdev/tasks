---
title: "activemodel: Attribute#value_for_database memo ivar keeps its Rails name"
status: ready
updated: 2026-10-02
rfc: "0173-activemodel-parity-100"
cluster: receipts
packages: ["activemodel"]
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

Surfaced by `activemodel-audit-permanent-receipts-root`.
`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute.rb:55-60`:

```ruby
def value_for_database
  if !defined?(@value_for_database) || type.changed_in_place?(@value_for_database, value)
    @value_for_database = _value_for_database
  end
  @value_for_database
end
```

Rails has an ivar `@value_for_database` and a private method `_value_for_database` (`attribute.rb:165`).
trails spells an ivar with a leading underscore, so both would be `_valueForDatabase`, and a JS class
cannot hold a field and a method of one name. `packages/activemodel/src/attribute.ts` therefore names
the memo `_cachedValueForDatabase` (plus an invented `_hasValueForDatabase` flag for `defined?`), and
`get valueForDatabase` carries `@missingRailsArgs changed_in_place? — PERMANENT` for the resulting
`ref:` difference. The pair is not one `classifyPair` files permanent (`ivar-underscore` wants
`_valueForDatabase`), which is why the receipt is an Args one, and no CLAUDE.md section ratifies it.

## Acceptance criteria

- [ ] The memo is held where its Rails name does not collide — e.g. an ivar declared through `rbDeclareIvar(Attribute, "@value_for_database", …)` that the naming gate reads as `value_for_database`, with `defined?` answered by the ivar's presence — or the naming taxonomy gains a tested class for an ivar whose underscore spelling is taken by a Rails `_method`.
- [ ] `get valueForDatabase` carries no `@missingRailsArgs` receipt; `pnpm parity:api:calls:args` green.

## Verification

```bash
pnpm parity:api:calls:args && pnpm vitest run packages/activemodel/src/attribute.test.ts
```
