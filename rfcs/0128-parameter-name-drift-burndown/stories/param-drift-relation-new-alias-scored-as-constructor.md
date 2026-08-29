---
title: "param-drift-relation-new-alias-scored-as-constructor"
status: in-progress
updated: 2026-08-29
rfc: "0128-parameter-name-drift-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 2
pr: 7213
claim: "2026-08-29T17:33:51Z"
assignee: "param-drift-relation-new-alias-scored-as-constructor"
blocked-by: null
closed-reason: null
---

## Context

`param-drift-activerecord-relation-and-scoping` (PR for RFC 0128) converged 60 of
the 61 measured parameter-name rows in `relation.rb`, `relation/**` and
`scoping.rb`. One row survives, and it is not parameter drift:

```
relation.rb  relation.ts  new -> constructor  @0  ruby=attributes  ts=options
```

`ActiveRecord::Relation#new` (`vendor/rails/activerecord/lib/active_record/relation.rb:125`)
is an _instance_ method — `alias build new` on line 133 — so the port spells it
`build`, and `relation.ts:build(attributes, block)` already matches the Ruby
`build` pair cleanly. The row exists only because
`scripts/parity/conventions.ts:1496` maps every Ruby `new` to TS `constructor`,
so the alias is scored a second time against a constructor.

The candidate it aligns against is `Relation::ExplainProxy#initialize(relation, options)`
(`relation.rb:7`), whose TS constructor carries exactly those Rails names.
`isReceiverParam` (`scripts/api-compare/arity.ts:151`) strips a leading
`relation` as a receiver, leaving the one-length form `['options']`, which then
lines up against Ruby's one-length `[attributes]`. arity.ts documents that a
strip "can only ever gain a match, never manufacture a mismatch" — in
`param-names.ts` it does manufacture one.

No rename can fix this: `attributes` is not a name any constructor in
`relation.ts` should carry, and both TS signatures involved already spell their
Rails identifiers.

## Acceptance criteria

- The `relation.rb#new -> constructor` row no longer appears in
  `output/param-name-mismatches.json`, fixed on the _tool_ side — either by not
  mapping a Ruby instance-method `new` onto `constructor` when the Ruby file also
  records the aliased name, or by not letting a receiver-strip form manufacture a
  parameter-name mismatch.
- `pnpm parity:api` methods, arity and inheritance figures are unmoved: the fix
  must not change which pairs MATCH, only which are scored for parameter names.
- `pnpm parity:api:params` stays green for the enrolled packages.
