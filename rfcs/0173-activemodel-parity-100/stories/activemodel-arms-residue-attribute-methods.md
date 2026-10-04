---
title: "activemodel: converge the 14 remaining report-arms rows in attribute-methods.ts"
status: draft
updated: 2026-10-04
rfc: "0173-activemodel-parity-100"
cluster: arms
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Measured on a clean build at trails 55595a6218 by `activemodel-parity-100-close-out`:
`pnpm tsx scripts/api-compare/report-arms.ts --sample=40 --package=activemodel` still lists
29 mismatched pairs for activemodel, although every arms story of RFC 0173 is done. This story
owns the 14 rows in `attribute-methods.ts`. A `-token` is a Rails arm the port drops, a `+token` is an
arm the port adds, `order` is the same arms in a different order.

- `packages/activemodel/attribute-methods.ts` `attributeMethodPatternsMatching` (count: `+if`) against `vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_methods.rb` `attribute_method_patterns_matching`
- `packages/activemodel/attribute-methods.ts` `attributeMissing` (count: `+if +throw`) against `vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_methods.rb` `attribute_missing`
- `packages/activemodel/attribute-methods.ts` `generatedAttributeMethods` (count: `+if`) against `vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_methods.rb` `generated_attribute_methods`
- `packages/activemodel/attribute-methods.ts` `aliasAttributeMethodDefinition` (count: `-if`) against `vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_methods.rb` `alias_attribute_method_definition`
- `packages/activemodel/attribute-methods.ts` `defineAttributeMethods` (count: `+if`) against `vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_methods.rb` `define_attribute_methods`
- `packages/activemodel/attribute-methods.ts` `aliasAttribute` (count: `+if`) against `vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_methods.rb` `alias_attribute`
- `packages/activemodel/attribute-methods.ts` `attributeMethodPatternsCache` (count: `+if`) against `vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_methods.rb` `attribute_method_patterns_cache`
- `packages/activemodel/attribute-methods.ts` `defineAttributeMethodPattern` (count: `+if`) against `vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_methods.rb` `define_attribute_method_pattern`
- `packages/activemodel/attribute-methods.ts` `missingAttribute` (count: `+if`) against `vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_methods.rb` `missing_attribute`
- `packages/activemodel/attribute-methods.ts` `defineProxyCall` (count: `-if`) against `vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_methods.rb` `define_proxy_call`
- `packages/activemodel/attribute-methods.ts` `aliasesByAttributeName` (count: `+if`) against `vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_methods.rb` `aliases_by_attribute_name`
- `packages/activemodel/attribute-methods.ts` `attributeMethodPrefix` (count: `+if`) against `vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_methods.rb` `attribute_method_prefix`
- `packages/activemodel/attribute-methods.ts` `_readAttribute` (count: `+if`) against `vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_methods.rb` `_read_attribute`
- `packages/activemodel/attribute-methods.ts` `attributeMethodSuffix` (count: `+if`) against `vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_methods.rb` `attribute_method_suffix`

Count Rails' real arms in the vendored body before changing anything: a row can be an idiom-fold
artifact of the report. Several `+if` rows are the own-property memo guard that stands in for
`inherited` (CLAUDE.md, "`inherited` is deferred to own-property memo guards"); those take an
`@inventedArm if — PERMANENT` receipt on the declaration, not a rewrite. Every other row converges
the body onto Rails' control flow.

## Acceptance criteria

- [ ] Each row above is gone from `pnpm parity:api:arms:report --package=activemodel`: converged onto the Rails body, or receipted `@inventedArm <token> — PERMANENT` where a ratified CLAUDE.md section forces the arm.
- [ ] No row is closed by a `CONVERGEABLE` receipt without a story id, and no baseline row is added.
- [ ] `pnpm parity:api:calls`, `pnpm parity:api:calls:args`, `pnpm parity:api:arms:throws` and `pnpm parity:api:pins` stay green; a body whose digest moves is re-pinned after it is re-read against Rails.
