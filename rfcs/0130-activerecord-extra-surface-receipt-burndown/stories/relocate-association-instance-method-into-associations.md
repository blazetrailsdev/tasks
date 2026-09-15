---
title: "relocate-association-instance-method-into-associations"
status: done
updated: 2026-09-15
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#7763
claim: "2026-09-14T23:54:24Z"
assignee: "relocate-association-instance-method-into-associations"
blocked-by: null
closed-reason: null
---

## Context

Split from `relocate-attribute-inspection-and-association-instance-methods`
(RFC 0130), whose attribute-inspection half shipped (attribute-inspection.ts
deleted; `InspectionMask` / `inspectionFilter` now in `core.ts`,
`formatForInspect` in `attribute-methods.ts`).

The remaining half: `packages/activerecord/src/associations/instance-methods.ts`
holds `association` — `ActiveRecord::Associations#association(name)`
(`vendor/rails/activerecord/lib/active_record/associations.rb:51-62`) — plus the
`InstanceMethods` include bag `base.ts` mixes in (`base.ts` `include(Base,
_AssocInstance.InstanceMethods)`). Both carry
`@noRailsEquivalent CONVERGEABLE relocate-attribute-inspection-and-association-instance-methods`
receipts.

It cannot move into `associations.ts` yet: that file already exports a
different public `association(record, assocName)` returning the CollectionProxy
(re-exported from `index.ts`, ~35 importers). Two `association` exports cannot
share one module. That collision is exactly
`disambiguate-association-vs-collection-proxy-accessor` (RFC 0023, draft).

Also note `association-class-slots.ts`: `base.ts` loads the six concrete
association ctors through `instance-methods.ts`; moving `_buildAssociationInstance`
into the `associations.ts` funnel must keep that load edge (verify with a
plain-node import of built `dist/**.js`). Rails builds via
`reflection.association_class.new(self, reflection)`.

## Acceptance criteria

- After the proxy-returning `association` is renamed, `association(name)` lives
  in `associations.ts`, `instance-methods.ts` is deleted, `base.ts` mixes it in
  from `associations.ts`.
- The receipts naming `relocate-attribute-inspection-and-association-instance-methods`
  are removed; `pnpm parity:api:extra:gate` stays green.
