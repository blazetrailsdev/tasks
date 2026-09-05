---
title: "nullable-attribute-type-assertions-outside-attribute"
status: done
updated: 2026-09-05
rfc: "0134-activemodel-surfaced-deviations"
cluster: guard-parity
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 7507
claim: "2026-09-05T02:42:13Z"
assignee: "collapse-abstract-type-into-value-type"
blocked-by: null
closed-reason: null
---

## Context

trails#7436 made `Attribute#type` nullable to express `attr.with_type(nil)`
(`activemodel/lib/active_model/attribute_set/yaml_encoder.rb:15`) and
`attr.type.nil?` (`:27`). Inside `Attribute` the fallout was resolved
faithfully: the sites that dereference are Ruby method sends that raise
`NoMethodError` on a nil type there, so `this.type!` is the honest spelling.

Four sites OUTSIDE `Attribute` were resolved with the same `!` even though the
Ruby they mirror passes the value through rather than sending to it:

- `AttributeSet#castTypes` (`packages/activemodel/src/attribute-set.ts:46`) is
  `transform_values(&:type)` (`activemodel/lib/active_model/attribute_set.rb`) —
  Ruby yields the nil, trails asserts non-null and types the result
  `Record<string, Type>`.
- `AttributeRegistration`'s decorator application
  (`packages/activemodel/src/attribute-registration.ts:88`) passes
  `existing.type!` where Ruby passes `attribute.type` straight into the
  decorator block.
- `Base.typeForAttribute` (`packages/activerecord/src/base.ts:896`) returns
  `getAttribute(resolved).type!`.
- `QueryAttribute#with_cast_value`
  (`packages/activerecord/src/relation/query-attribute.ts:41`) passes
  `this.type!` into a `CastType` parameter.

None can observe a nil today — only an attribute inside a `Psych::Coder`
payload carries one, and those never reach these paths — so this is latent, not
a live bug. It is still four assertions standing where Ruby has a plain value.

## Converged shape

Each site admits `Type | null` and passes it through as Ruby does:
`castTypes` returns `Record<string, Type | null>`, the decorator parameter and
`typeForAttribute`'s return widen to match their Ruby counterparts, and
`QueryAttribute`'s `CastType` parameter admits null. Callers that genuinely
need a non-null type narrow at their own site, which is where Ruby would raise.

Worth deciding as one story rather than four, because the four returns are read
widely and the widening cascades; if a site turns out to be provably non-null by
construction, say so at the site rather than asserting.

## Acceptance criteria

- [ ] None of the four sites carries a `!` on `type`.
- [ ] `castTypes`' return type admits null, matching `transform_values(&:type)`.
- [ ] `pnpm typecheck` clean with no new assertions pushed to callers.
- [ ] `pnpm parity:api` deltas non-negative.
