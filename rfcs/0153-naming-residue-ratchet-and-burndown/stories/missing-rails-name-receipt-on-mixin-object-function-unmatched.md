---
title: "@missingRailsName receipts on a function that is also a mixin-object member never register"
status: ready
updated: 2026-09-24
rfc: "0153-naming-residue-ratchet-and-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found after trails#8022 merged. In `scripts/api-compare/output/call-arg-mismatches.json`, four activerecord `naming` rows have no `receipts`, even though each declaration carries a matching `@missingRailsName <id> — PERMANENT` JSDoc tag:

| TS file                                                         | declaration            | tag                      | Rails                                                                                                             |
| --------------------------------------------------------------- | ---------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `connection-adapters/abstract/connection-pool/queue.ts:109-113` | `withABiasFor`         | `lock`, `cond`           | `connection_pool/queue.rb` `with_a_bias_for` (`BiasableQueue::BiasedConditionVariable.new(@lock, @cond, thread)`) |
| `connection-adapters/abstract/database-statements.ts`           | `truncate`             | `buildTruncateStatement` | `abstract/database_statements.rb` `truncate` (`execute(build_truncate_statement(table_name), name)`)              |
| `connection-adapters/abstract/database-statements.ts`           | `addTransactionRecord` | `ensureFinalize`         | `abstract/database_statements.rb` `add_transaction_record`                                                        |
| `core.ts`                                                       | `isFrozen`             | `attributes`             | `core.rb` `frozen?` (`@attributes.frozen?`)                                                                       |

Other top-level `export function` receipts do register, for example `model-schema.ts` `columns` → `columnsHash` and `attribute-methods.ts` `initializeGeneratedModules`. All four failing functions are ALSO listed as members of a mixin object literal in the same file (for example `queue.ts:140`). The likely cause: `tsMissingNameTagsByFileName` / `tagsForOwner(..., tsClass)` (`scripts/api-compare/compare.ts:4766-4769`) keys the tag under one owner, while the row carries a different `tsClass`. The tags also never show up in `staleNameTags`, so the failure is silent.

This blocks `naming-burndown-activerecord-behavioral`: once activerecord joins `NAMING_ENROLLED_PACKAGES`, these four rows would red as `unreceipted`.

## Acceptance criteria

- [ ] A `@missingRailsName` tag on a top-level function that is also a mixin-object member suppresses its naming row, keyed the same way `@missingRailsArgs` / `@missingRailsCall` resolve the owner.
- [ ] A compare unit test covers a receipted mixin-object function.
- [ ] The four rows above show `receipts` in `call-arg-mismatches.json`.
