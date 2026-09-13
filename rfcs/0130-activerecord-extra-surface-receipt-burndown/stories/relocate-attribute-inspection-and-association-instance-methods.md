---
title: "relocate-attribute-inspection-and-association-instance-methods"
status: draft
updated: 2026-09-13
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `receipt-moved-associations-and-attribute-methods` (RFC 0130). Two
TS files have no Rails counterpart; their public names are misplaced ports, not
coincidences, so they carry per-declaration
`@noRailsEquivalent CONVERGEABLE relocate-attribute-inspection-and-association-instance-methods`
receipts rather than a file-level PERMANENT verdict.

- `packages/activerecord/src/attribute-inspection.ts`
  - `InspectionMask` (and its `toString` / `inspect` / `toJSON`) —
    `ActiveRecord::Core::InspectionMask < DelegateClass(::String)`
    (`activerecord/lib/active_record/core.rb:858-863`). Should live in `core.ts`,
    ideally built on ruby-compat's `DelegateClass`.
  - `inspectionFilter` — `Core::ClassMethods#inspection_filter` (`core.rb:363`, `:865`) → `core.ts`.
  - `formatForInspect` — `AttributeMethods#format_for_inspect`
    (`attribute_methods.rb:527`) → `attribute-methods.ts`.
- `packages/activerecord/src/associations/instance-methods.ts`
  - `association` — `Associations#association(name)` (`associations.rb:51`) → `associations.ts`.
  - `InstanceMethods` — the include bag `base.ts` mixes in; it disappears once
    its members live in `associations.ts`.

Watch the load-order cycles recorded in CLAUDE.md ("Call-time constant
resolution"): `associations.ts` and `core.ts` are funnel modules; verify with a
plain-node import of the built `dist/**.js`.

## Acceptance criteria

- Both files are deleted; each name lives in the TS file mirroring its `.rb`.
- The receipts are removed; `pnpm parity:api:extra:tighten` narrows activerecord's `total`.
