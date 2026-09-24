---
title: "Replace activerecord's local toI helpers with ruby-compat toI"
status: done
updated: 2026-09-24
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: 1
pr: trails#8052
claim: "2026-09-24T18:29:09Z"
assignee: "adapter-foreign-key-test-loads-fk-test-has-pk-fixture"
blocked-by: null
closed-reason: null
---

## Context

trails#8033 added ruby-compat `toI` (`packages/ruby-compat/src/numeric.ts`), the
`obj.to_i` send (nil / Integer / Float / String via `rbStrToI` / own `toI`).
Three activerecord files still carry private hand-rolled `toI` helpers that
approximate it with `parseInt`/`Number`:

- `associations/has-many-association.ts` (`function toI`, used for the counter
  cache read — Rails `has_many_association.rb` `owner.read_attribute(...).to_i`)
- `attribute-methods/query.ts` (`function toI`, Rails `attribute_methods/query.rb`
  `!value.to_i.zero?`)
- `connection-adapters/postgresql/oid/type-map-initializer.ts` (`function toI`,
  Rails `oid/type_map_initializer.rb` `row["oid"].to_i`, `row["typelem"].to_i`, …)

`parseInt(String(x))` differs from `String#to_i` on underscores (`"1_000".to_i`
is 1000) and from `Float#to_i` on non-finite floats (FloatDomainError).

## Acceptance criteria

- The three local helpers are deleted and every call site uses ruby-compat `toI`.
- Affected suites stay green; no new call/args rows.
