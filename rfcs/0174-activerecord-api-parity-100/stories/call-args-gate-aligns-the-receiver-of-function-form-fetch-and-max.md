---
title: "parity: the call-argument gate aligns the receiver of function-form fetch and max"
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

Three bodies call a ruby-compat function where Rails calls a method on the receiver, so the
call-argument comparator reads the Ruby receiver as an extra leading TS argument:

| Rails site                                                                                                                                                                        | Ruby args                     | TS args                                        |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ---------------------------------------------- |
| `vendor/rails/v8.0.2/activerecord/lib/active_record/relation.rb:478` `records.map { … }.max` (`compute_cache_version`)                                                            | none                          | `ref:map`                                      |
| `vendor/rails/v8.0.2/activerecord/lib/active_record/relation/calculations.rb:570` `calculated_data.column_types.fetch(aliaz, Type.default_value)` (`execute_grouped_calculation`) | `ref:aliaz, ref:defaultValue` | `ref:columnTypes, ref:aliaz, ref:defaultValue` |
| `calculations.rb:604` `join.base_klass.attribute_types.fetch(name, nil)` (`lookup_cast_type_from_join_dependencies`)                                                              | `ref:name, nil`               | `ref:attributeTypes, ref:name, nil`            |

The TS bodies are `max(records.map(…))` (`packages/activerecord/src/relation.ts`
`computeCacheVersion`) and `fetch(hash, key, default)`
(`packages/activerecord/src/relation/calculations.ts` `executeGroupedCalculation`,
`lookupCastTypeFromJoinDependencies`), each the ruby-compat port of the MRI method
(`packages/ruby-compat/src/comparable.ts` `max`, `vendor/ruby/v3.3.11/array.c:5848`;
`packages/ruby-compat/src/hash.ts` `fetch`, `vendor/ruby/v3.3.11/hash.c:2176`). They carry
`@missingRailsArgs max` / `@missingRailsArgs fetch`.

`scripts/api-compare/receiver-as-first-arg.ts`'s `RECEIVER_AS_FIRST_ARG` aligns a free
function's leading receiver by NAME and holds neither. `max` is a Ruby core built-in no Rails
class defines, so it qualifies by the table's own rule. `fetch` does not qualify by name:
`ActiveSupport::Cache::Store#fetch` is Rails-defined. It needs the receiver-keyed arm
`call-args-gate-aligns-the-receiver-of-a-function-form-hash-merge` builds for `merge`
(align only when the TS callee is the ruby-compat export, never a method call on a receiver).

The same receipts are `PERMANENT` elsewhere and are the population this closes:
`@missingRailsArgs max` in `packages/trailties/src/thor/shell/column-printer.ts` and
`table-printer.ts`; `@missingRailsArgs fetch` in `packages/activerecord/src/result.ts`,
`token-for.ts` (3), `connection-adapters/abstract/schema-definitions.ts`,
`connection-adapters/abstract/schema-statements.ts`,
`packages/activesupport/src/actionable-error.ts` and
`packages/actionpack/src/action-dispatch/journey/route.ts`.

## Acceptance criteria

- [ ] `max` is aligned as a receiver-first built-in, and a function-form `fetch` is aligned when the TS callee is ruby-compat's `fetch` export and never when it is a method call (`cache.fetch(key)` stays compared as written), with unit tests for both and for a `Cache::Store#fetch` site that must still flag a real argument difference.
- [ ] The three receipts above are deleted and `pnpm parity:api:calls:args` is green with no baseline row added.
- [ ] Every other `@missingRailsArgs max` / `fetch` receipt the alignment clears is deleted; any that survive are listed in the PR body with the reason.

## Verification

```bash
pnpm vitest run scripts/api-compare/call-args.test.ts && API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api:calls:args
```
