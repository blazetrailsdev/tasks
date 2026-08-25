---
title: "Default inheritance_column to 'type' and gate STI dispatch on column-aware _has_attribute?"
status: done
updated: 2026-06-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 3302
claim: "2026-06-14T22:26:15Z"
assignee: "inheritance-column-default-type-and-has-attribute-gate"
blocked-by: null
---

## Context

Surfaced by `f9g2-sti-dispatch-at-new` (PR #3195). Two related trails
divergences from Rails' inheritance handling block faithful STI:

1. Rails defaults `inheritance_column` to `"type"` for every model;
   trails' `getInheritanceColumn` returns `null` unless STI is explicitly
   enabled via `enableSti`. STI-at-new works around this by defaulting to
   `"type"` locally in `subclassFromAttributesForNew`.
2. Rails gates STI dispatch on `_has_attribute?(inheritance_column)`
   (`attribute_types.key?`), which reflects DB columns. trails'
   `hasAttributeDefinition` only covers explicitly-declared `attribute()`
   calls, not reflected schema columns — so the `_has_attribute?` gate
   couldn't be ported, and the STI-subtree fast-path stands in for it.

As a consequence the canonical `Company` needed `registerSubclass` calls added
to make its STI subtree reachable, rather than STI being inferred from the
schema. Converging means: default `inheritance_column` to `"type"` globally
(without breaking the `Base.inheritanceColumn returns null when STI is not
enabled` test — likely reconcile that test against Rails) and make a
column-aware `_has_attribute?` available at construction.

## Acceptance criteria

- [ ] `inheritance_column` defaults to `"type"` matching Rails, with the
      existing inheritance tests reconciled.
- [ ] A column-aware `_has_attribute?` equivalent gates STI dispatch, so the
      local `?? "type"` default and STI-subtree fast-path in
      `subclassFromAttributesForNew` can be removed/simplified.
- [ ] Canonical models infer STI from schema without manual `registerSubclass`
      bookkeeping where avoidable.
