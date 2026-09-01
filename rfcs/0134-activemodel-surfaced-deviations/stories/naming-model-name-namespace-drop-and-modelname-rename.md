---
title: "activemodel: modelName hardcodes namespace=null unreceipted; ModelName vs Rails' Name scores novel"
status: ready
updated: 2026-09-01
rfc: "0134-activemodel-surfaced-deviations"
cluster: invented-arm
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 25
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Two naming.ts findings:

1. Rails `model_name` detects a namespace via
   `module_parents.detect { |n| n.respond_to?(:use_relative_model_naming?) && n.use_relative_model_naming? }`
   (`vendor/rails/activemodel/lib/active_model/naming.rb:271-278`). trails
   hardcodes `const namespace = null`
   (`packages/activemodel/src/naming.ts:20-26`) with no receipt or comment.
   JS has no module nesting, so the drop may be a genuine language gap — but
   it leaves the faithfully-ported namespace/`paramKey`/`routeKey` branch
   (naming.ts:194-212) dead. Record the decision at the site (receipt/comment
   citing this story) or find the trails analogue for engine-style namespacing.
2. Rails' class is `ActiveModel::Name` (naming.rb:9); trails spells it
   `ModelName` (naming.ts:107). `parity:api` matches the pair, yet
   `parity:api:extra` scores `ModelName` novel — the two tools disagree about
   the rename. Settle which is right: if `Name` is untenable in TS (clash with
   something?), the class needs a receipt and the extra-surface scorer or
   conventions table taught the mapping; if not, rename to the conventions
   output.

## Acceptance criteria

- The `namespace = null` site carries either a working namespace detection or
  a recorded decision (receipt shape).
- `ModelName` either renamed per `docs/ruby-ts-conventions.md`'s rule for
  `Name`, or receipted AND the `parity:api` / `parity:api:extra` disagreement
  resolved in `scripts/parity/conventions.ts` (change the rule there, never
  the generated doc).
- naming tests stay green.
