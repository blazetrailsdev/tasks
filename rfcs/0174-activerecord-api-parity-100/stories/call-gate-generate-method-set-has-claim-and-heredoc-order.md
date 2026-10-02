---
title: "parity: the call gate's has claim and heredoc-blind order stream flag generate_method"
status: draft
updated: 2026-10-02
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-relation-part-1` audit: the receipts below were `PERMANENT`, no CLAUDE.md section ratifies them, and they are re-tagged `CONVERGEABLE` onto this story.

The audit converged `GeneratedRelationMethods#generateMethod`
(`packages/activerecord/src/relation/delegation.ts`) onto
`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/delegation.rb:74-92`: `return if
method_defined?(method)` is `this.isMethodDefined(method)`, the `module_eval` arm assigns the
method inside `this.moduleEval`, and the `else` arm is `this.defineMethod(method, …)`. The
`@missingRailsCall define_method` receipt is gone. Two rows remain, and both are artifacts of the
gate, not of the body:

1. **`include?`.** `::ActiveSupport::Delegation::RESERVED_METHOD_NAMES.include?(method.to_s)`
   (`delegation.rb:78`) is `RESERVED_METHOD_NAMES.has(String(method))`, and `include?` → `has`
   is in `JS_ENUMERABLE_ALIASES` (`scripts/api-compare/enumerable-idioms.ts`). But
   `SUPPRESSED_CALL_TS_SPELLINGS` (`scripts/api-compare/compare.ts`) maps the suppressed
   `method_defined?` to `has`, and `suppressedCallClaims` withholds `has` from the TS call-set
   whenever the Ruby body names `method_defined?`. So the one `has` in the body is claimed by a
   call the body already ports as `isMethodDefined`, and `include?` reads as missing.
2. **`order:scoping,defineMethod`.** Rails' first arm is a heredoc
   (`module_eval <<-RUBY … scoping { model.#{method}(...) } … RUBY`, `delegation.rb:79-83`), which
   Ripper does not parse, so the Ruby call stream holds `scoping` only after `define_method`
   (`delegation.rb:85-87`). The TS body calls `scoping` in both arms, so its first `scoping`
   precedes `defineMethod`.

The body carries `@missingRailsCall include?` and `@missingRailsCall order:scoping,defineMethod`.

## Acceptance criteria

- [ ] `suppressedCallClaims` does not withhold an alias spelling for a suppressed Ruby call when the TS body makes that call under its convention name (`isMethodDefined` for `method_defined?`), with a unit test for this body's shape and one for the shape the claim exists for (a lone `has` standing in for `method_defined?`).
- [ ] The order stream does not position a TS call against a Ruby body whose only earlier occurrence sits inside a `module_eval` / `class_eval` string, with a unit test.
- [ ] The two receipts above are deleted and `pnpm parity:api:calls` is green with no baseline row added.

## Verification

```bash
pnpm vitest run scripts/api-compare && API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api:calls
```
