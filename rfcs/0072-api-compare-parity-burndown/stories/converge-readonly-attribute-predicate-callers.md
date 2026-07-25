---
title: "converge-readonly-attribute-predicate-callers"
status: in-progress
updated: 2026-07-25
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5321
claim: "2026-07-25T20:38:52Z"
assignee: "converge-readonly-attribute-predicate-callers"
blocked-by: null
closed-reason: null
---

## Context

`api:compare --wide-calls` now flags four Rails call sites whose TS port reads
the readonly-attribute set directly instead of delegating to the ported
predicate, mirroring Rails' `readonly_attribute?(name)`:

- `packages/activerecord/src/attribute-methods.ts:575` (`attributesForUpdate`)
  — `mc._readonlyAttributes?.has?.(name)` vs Rails
  `attribute_methods.rb` `attributes_for_update` → `readonly_attribute?`.
- `packages/activerecord/src/persistence.ts` (`verifyReadonlyAttribute`).
- `packages/activerecord/src/readonly-attributes.ts` (`writeAttribute`,
  `_writeAttribute`) — Rails
  `vendor/rails/activerecord/lib/active_record/readonly_attributes.rb`
  `HasReadonlyAttributes` calls `readonly_attribute?(name)`.

The predicate itself is ported as `readonlyAttributeQ`
(`readonly-attributes.ts:90`). These were invisible until PR #5312 made alias
bindings carry their target's real arity, which promoted the predicate past the
calls-parity "ported with args" gate. The four entries are currently baselined
in `scripts/api-compare/call-mismatches-wide-exclude/` with a pointer to this
story.

## Acceptance criteria

- The four call sites delegate to `readonlyAttributeQ` (via the model class, as
  Rails does through `self.class.readonly_attribute?`) instead of poking at
  `_readonlyAttributes`.
- The corresponding `readonly_attribute?` entries are removed from the
  `call-mismatches-wide-exclude` baselines and
  `pnpm exec tsx scripts/api-compare/lint-call-mismatches-wide.ts` stays OK.
- Existing readonly-attribute tests still pass.
