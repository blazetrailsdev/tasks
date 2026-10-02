---
title: "parity: the call-args gate aligns the receiver of a function-form Hash#merge"
status: draft
updated: 2026-10-02
rfc: "0179-api-compare-crediting-rules"
cluster: call-args
packages: ["activerecord", "actionpack"]
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

Surfaced by the `activerecord-audit-permanent-receipts-ca-abstract` audit. Four `Hash#merge` sites in
`connection_adapters/abstract/` carried `@missingRailsCall merge — PERMANENT` over an object spread.
The audit converged the call: each body now calls ruby-compat's `merge(hash, other)`
(`packages/ruby-compat/src/hash.ts`, `rb_hash_merge`, `vendor/ruby/v3.3.11/hash.c:4144`). That
turns the call-set gate green and reds the call-ARGUMENT gate instead, because the comparator reads
the Ruby receiver as a missing argument:

| Rails site                                                                                                                                                       | Ruby args                | TS args                                 |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | --------------------------------------- |
| `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/schema_creation.rb:147` `o.options.merge(column: o)`                            | `kwargs{column=ref:o}`   | `ref:options, kwargs{column=ref:o}`     |
| `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb:259` `as_options(polymorphic).merge(conditional_options)` | `ref:conditionalOptions` | `ref:asOptions, ref:conditionalOptions` |
| `schema_definitions.rb:259` `….merge(options.slice(:null, :first, :after))`                                                                                      | `ref:slice`              | `ref:merge, ref:slice`                  |
| `schema_definitions.rb:267` `as_options(index).merge(conditional_options)`                                                                                       | `ref:conditionalOptions` | `ref:asOptions, ref:conditionalOptions` |

So `packages/activerecord/src/connection-adapters/abstract/schema-creation.ts` (`columnOptions`) and
`packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts` (`polymorphicOptions`,
`indexOptions`) carry `@missingRailsArgs merge — CONVERGEABLE` onto this story.

`scripts/api-compare/receiver-as-first-arg.ts`'s `RECEIVER_AS_FIRST_ARG` is the table that aligns a
free function's leading receiver. It holds `merge!`, `update` and `except` but not `merge`, and its
header says why: `Relation#merge` is a Rails-defined method, and a name Rails defines on a Rails
class never qualifies by name alone. `scripts/parity/ruby-compat.ts` already answers that exact
ambiguity for the call-SET gate: `RECEIVER_KEYED_RUBY_COMPAT_EXPORTS` admits `Hash#merge` → `merge`
only where the receiver kind is proven. The argument gate has no such receiver-keyed arm.

The same receipt is `PERMANENT` at five actionpack sites
(`action-controller/metal/strong-parameters.ts`, `action-dispatch/journey/router.ts`,
`action-dispatch/middleware/ssl.ts`, `action-dispatch/routing/route-set.ts`,
`action-dispatch/routing/mapper.ts`), which is the population this closes.

## Acceptance criteria

- [ ] `alignBuiltinReceiver` (`scripts/api-compare/call-args.ts`) aligns the leading receiver of a function-form `merge` when the TS callee is ruby-compat's `merge` export, never when it is a method call on a receiver (`relation.merge(other)` stays compared as written), with unit tests for both and for a `Relation#merge` site that must still flag a real argument difference.
- [ ] The three `@missingRailsArgs merge` receipts in `connection-adapters/abstract/` are deleted and `pnpm parity:api:calls:args` is green with no baseline row added.
- [ ] The five actionpack `@missingRailsArgs merge — PERMANENT` receipts are deleted where the same alignment clears their row; any that survive are listed in the PR body with the reason.

## Verification

```bash
pnpm vitest run scripts/api-compare/call-args.test.ts && API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api:calls:args
```
