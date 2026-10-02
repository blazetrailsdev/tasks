---
title: "activerecord: Persistence#reload re-syncs select-alias singleton readers Rails answers from method_missing"
status: blocked
updated: 2026-10-02
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: "Converging needs an undeclared attribute answered from the live @attributes at read time, which is method_missing on a record. CLAUDE.md § 'Records are not Proxies' rules that out on measured cost (attribute read 3.7x, internal field read 64x), so the readers must be installed, and reload replaces the @attributes they were installed for."
closed-reason: null
---

## Context

Split from `activerecord-converge-invented-control-flow-arms-root-g-p-part-3` (trails#8418).
`pnpm parity:api:arms:report --package=activerecord --direction=invented` lists
`persistence.ts#reload` at `+if +loop +if`.

Rails (`vendor/rails/v8.0.2/activerecord/lib/active_record/persistence.rb:742-757`) ends:

```ruby
@association_cache = fresh_object.instance_variable_get(:@association_cache)
@association_cache.each_value { |association| association.owner = self }
@attributes = fresh_object.instance_variable_get(:@attributes)
@new_record = false
@previously_new_record = false
self
```

`packages/activerecord/src/persistence.ts#reload` has those lines, plus a block after the
`@attributes` assignment that Rails does not have: it undefines the record's singleton-class
attribute methods and defines one for every attribute the record does not answer.

The block exists because a record loaded with `select("title AS t")` reaches `t` through a reader
`initWithAttributes` (`packages/activerecord/src/core.ts`) defines on the record's singleton class
(`select-alias-readers-onto-attribute-method-dispatch`, trails#8040). Rails defines nothing: an
undeclared attribute is answered by `ActiveModel::AttributeMethods#method_missing` /
`respond_to?` (`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_methods.rb`), which match
the name against the live `@attributes`. So in Rails replacing `@attributes` is the whole re-sync,
and in trails the readers installed for the old `@attributes` have to be re-installed for the new
one. `packages/activerecord/src/select-alias-reader.trails.test.ts` pins both halves: a reader the
fresh row lacks is dropped, one it still carries is kept. Removing the block reds it on every
adapter (trails#8418, commit 1c66e33).

No JSDoc receipt fits the block: `@noRailsEquivalent` covers a member with no Rails counterpart and
`reload` has one, and `@missingRailsCall` / `@missingRailsArgs` cover a call Rails makes and the
port omits. This story is the block's tracking.

## Acceptance criteria

- [ ] `reload` ends with Rails' five assignments and no singleton-class block, and
      `select-alias-reader.trails.test.ts` stays green.
- [ ] `pnpm parity:api:arms:report --package=activerecord --direction=invented` no longer lists
      `persistence.ts#reload`.

## Verification

```bash
pnpm vitest run packages/activerecord/src/select-alias-reader.trails.test.ts packages/activerecord/src/persistence.test.ts
pnpm parity:api --calls && pnpm parity:api:arms:report --package=activerecord --direction=invented
```
