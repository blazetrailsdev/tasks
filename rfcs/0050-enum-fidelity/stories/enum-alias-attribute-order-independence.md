---
title: "enum/alias_attribute resolution must be order-independent (dynamic, not eager)"
status: closed
updated: 2026-07-07
rfc: "0050-enum-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 11
pr: 4715
claim: null
assignee: null
blocked-by: null
closed-reason: "Mis-specified: acceptance asked trails to silently support enum-before-alias, but vendored Rails RAISES on that order (Undeclared attribute type for enum). Feature merged in #4715 reverted by #4719. True convergence (make trails raise) tracked by enum-before-alias-must-raise."
---

## Context

`_enum` in `packages/activerecord/src/enum.ts` resolves an `alias_attribute`
target **eagerly, once**, at the `enum()` call:

```ts
const attrName =
  (this as ...)._attributeAliases?.[attribute] ?? attribute;
```

So `alias_attribute :aliased_status, :status` must be declared **before**
`enum :aliased_status` for the enum to key storage / EnumType / reader / predicate
/ scope conditions off the backing `status` column. Declaring the enum first
leaves everything keyed off the un-resolved alias name (reads return nil).

Rails resolves the alias **dynamically per operation** (`attribute_aliases` is
consulted at read/write/query time, e.g. `type_for_attribute`'s
`attr_name = attribute_aliases[attr_name] || attr_name`), so order does not
matter there. trails' eager resolution is a deviation.

Surfaced in PR #4417 (enum-reserved-undeclared-override-alias). The shipped
`enum with alias_attribute` test (enum_test.rb:702-716) only exercises the
alias-then-enum order (which Rails' own suite uses), so the reverse order is
currently documented as unsupported via a code comment rather than handled.

## Acceptance criteria

- `enum` declared before `alias_attribute` on the same attribute resolves
  correctly: storage/reader/predicate/scope all hit the backing column, matching
  the alias-then-enum behavior.
- Prefer resolving the alias at use time (mirroring Rails' per-call
  `attribute_aliases` lookup) over eager capture, or re-resolve when the alias is
  later declared.
- Add a regression test for the enum-before-alias order (mirror the shipped
  alias-then-enum assertions); existing enum tests stay green.
