---
title: "activemodel: converge the 14 remaining report-arms rows outside attribute-methods.ts"
status: done
updated: 2026-10-04
rfc: "0173-activemodel-parity-100"
cluster: arms
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: trails#8502
claim: "2026-10-04T21:44:18Z"
assignee: "activemodel-arms-residue-outside-attribute-methods"
blocked-by: null
closed-reason: null
---

## Context

Measured on a clean build at trails 55595a6218 by `activemodel-parity-100-close-out`:
`pnpm tsx scripts/api-compare/report-arms.ts --sample=40 --package=activemodel` still lists
29 mismatched pairs for activemodel, although every arms story of RFC 0173 is done. This story
owns the 14 rows in the other activemodel files. A `-token` is a Rails arm the port drops, a `+token` is an
arm the port adds, `order` is the same arms in a different order.

- `packages/activemodel/type/serialize-cast-value.ts` `serialize` (order: `if try rescue -> try rescue if`) against `vendor/rails/v8.0.2/activemodel/lib/active_model/type/serialize_cast_value.rb` `serialize`
- `packages/activemodel/error.ts` `inspect` (count: `+if +if`) against `vendor/rails/v8.0.2/activemodel/lib/active_model/error.rb` `inspect`
- `packages/activemodel/validations.ts` `validate` (count: `+if`) against `vendor/rails/v8.0.2/activemodel/lib/active_model/validations.rb` `validate`
- `packages/activemodel/validations/helper-methods.ts` `_mergeAttributes` (count: `+if`) against `vendor/rails/v8.0.2/activemodel/lib/active_model/validations.rb` `_merge_attributes`
- `packages/activemodel/attribute-registration.ts` `pendingAttributeModifications` (count: `+if`) against `vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_registration.rb` `pending_attribute_modifications`
- `packages/activemodel/attribute-registration.ts` `attributeTypes` (count: `+if +if`) against `vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_registration.rb` `attribute_types`
- `packages/activemodel/validations/helper-methods.ts` `_mergeAttributes` (count: `+if`) against `vendor/rails/v8.0.2/activemodel/lib/active_model/validations/helper_methods.rb` `_merge_attributes`
- `packages/activemodel/secure-password.ts` `hasSecurePassword` (count: `+throw +if`) against `vendor/rails/v8.0.2/activemodel/lib/active_model/secure_password.rb` `has_secure_password`
- `packages/activemodel/naming.ts` `constructor` (count: `+if +if +if`) against `vendor/rails/v8.0.2/activemodel/lib/active_model/naming.rb` `initialize`
- `packages/activemodel/validations.ts` `validators` (count: `+loop`) against `vendor/rails/v8.0.2/activemodel/lib/active_model/validations.rb` `validators`
- `packages/activemodel/attribute-registration.ts` `attribute` (count: `+if +if +if`) against `vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_registration.rb` `attribute`
- `packages/activemodel/validations.ts` `predicateForValidationContext` (count: `+if`) against `vendor/rails/v8.0.2/activemodel/lib/active_model/validations.rb` `predicate_for_validation_context`
- `packages/activemodel/type/registry.ts` `register` (count: `-if`) against `vendor/rails/v8.0.2/activemodel/lib/active_model/type/registry.rb` `register`
- `packages/activemodel/attribute-registration.ts` `_defaultAttributes` (count: `+if`) against `vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_registration.rb` `_default_attributes`

Count Rails' real arms in the vendored body before changing anything: a row can be an idiom-fold
artifact of the report. Several `+if` rows are the own-property memo guard that stands in for
`inherited` (CLAUDE.md, "`inherited` is deferred to own-property memo guards"); those take an
`@inventedArm if — PERMANENT` receipt on the declaration, not a rewrite. Every other row converges
the body onto Rails' control flow.

## Acceptance criteria

- [ ] Each row above is gone from `pnpm parity:api:arms:report --package=activemodel`: converged onto the Rails body, or receipted `@inventedArm <token> — PERMANENT` where a ratified CLAUDE.md section forces the arm.
- [ ] No row is closed by a `CONVERGEABLE` receipt without a story id, and no baseline row is added.
- [ ] `pnpm parity:api:calls`, `pnpm parity:api:calls:args`, `pnpm parity:api:arms:throws` and `pnpm parity:api:pins` stay green; a body whose digest moves is re-pinned after it is re-read against Rails.
