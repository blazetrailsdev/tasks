---
title: "Wire AR readAttribute/writeAttribute onto Base instead of ActiveModel's"
status: draft
updated: 2026-08-04
rfc: "0023-surfaced-deviations"
cluster: null
deps: ["move-accessed-fields-tracking-to-attribute"]
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/attribute-methods.ts` exports `readAttribute`
(the port of read.rb:31-34) and `writeAttribute` (write.rb:31-34), but neither
is wired onto `Base` — no file imports them. `Base.readAttribute` is
ActiveModel's `Model#readAttribute` (packages/activemodel/src/model.ts:1671) and
`Base.writeAttribute` is `ReadonlyAttributes.writeAttribute`
(packages/activerecord/src/base.ts include list). So the AR ports are dead
surface, and the AR-specific behavior they carry (alias resolution via
`recordAliasName`, and read.rb's `"id"` → primary-key redirect noted as pending
in packages/activerecord/src/attribute-methods/read.ts) never runs on a record.

Surfaced in PR #6068 while porting `#[]` (attribute_methods.rb:415), which
Rails defines as `read_attribute(attr_name) { |n| missing_attribute(n, caller) }`
— i.e. it dispatches AR's `read_attribute`, not ActiveModel's.

## Converged shape

Wire `readAttribute` / `writeAttribute` from attribute-methods.ts into the
`include(Base, { ... })` AttributeMethods block in base.ts, so `Base` resolves
Rails' AR definitions. Blocked on [[move-accessed-fields-tracking-to-attribute]]:
`Model#readAttribute` is where `_accessedFields` is populated today, so swapping
it out reds `accessed_fields` until that tracking moves onto the attribute where
Rails keeps it.

## Acceptance criteria

- [ ] `Base.readAttribute` / `Base.writeAttribute` are the attribute-methods.ts
      ports; no caller reaches ActiveModel's directly for an AR record.
- [ ] `accessed_fields`, alias-attribute and `[]` tests stay green.
- [ ] `pnpm parity:api` / `pnpm parity:test` deltas non-negative.
