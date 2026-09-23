---
title: "Converge the model mixin plumbing #7836 left receipted"
status: draft
updated: 2026-09-23
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`converge-model-mixin-plumbing-surface` is done (trails#7836). Five
`@noRailsEquivalent CONVERGEABLE` receipts still cited it, so no open story
owned their debt. That was surfaced by trails#8004 and re-pointed here by
`retire-convergeable-receipts-citing-done-stories`:

- `enum.ts` `defineEnum`: Rails' `Enum#enum` / `_enum`
  (`activerecord/lib/active_record/enum.rb`) define the enum on the class.
- `multiparameter-attribute-assignment.ts` `extractMultiparameterCallstack`,
  `assignMultiparameterValues`: Rails spells these
  `AttributeAssignment#extract_callstack_for_multiparameter_attributes` /
  `#execute_callstack_for_multiparameter_attributes`
  (`activerecord/lib/active_record/attribute_assignment.rb`).
- `model-codegen.ts` `unqualify`, `generateModels`: trails-only codegen with
  no Rails file. Either move it out of the Rails-matched surface or delete it.

## Acceptance criteria

- Each name converges onto the Rails method it stands in for, or is moved or
  deleted, and its receipt goes with it.
- `git grep "CONVERGEABLE converge-model-mixin-plumbing-surface-remainder"` returns nothing.
- `pnpm parity:api:extra:gate` stays green.
