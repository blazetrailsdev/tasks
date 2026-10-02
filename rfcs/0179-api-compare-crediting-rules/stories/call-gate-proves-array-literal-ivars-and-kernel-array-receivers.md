---
title: "parity: the call gate proves Array-literal ivars and Kernel#Array receivers for size / last"
status: ready
updated: 2026-10-02
rfc: "0179-api-compare-crediting-rules"
cluster: call-set
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

Surfaced by the `activerecord-audit-permanent-receipts-ca-abstract` audit: the seven receipts below
were `PERMANENT`, no CLAUDE.md section ratifies them, and they are re-tagged `CONVERGEABLE` onto this
story.

`scripts/api-compare/compare.ts`'s `significantCallsForReceivers` drops a
`POSITIONAL_ARRAY_ANALOGUES` name (`first` / `last` / `any?` / `size` / `empty?`) from significance
for one Ruby body when `extract-ruby-api.rb`'s receiver-kind data proves every site of it an
`array`, because the faithful port is a property or index form (`.length`, `.at(-1)`), not a call.
Today that proof covers a literal, a traced local, and a `split` / `scan` / `keys` / `values` chain.
The comment above it records candidate (2), per-class ivar typing, as NOT BUILT.

Seven rows in `connection_adapters/abstract/` are exactly that unbuilt case, and every one is an
`Array` by construction:

| Rails site                                                                                                                                                                      | Receiver     | Proof available to Ripper                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------- |
| `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/transaction.rb:528` `@stack.size` (`begin_transaction`)                                        | `@stack`     | `@stack = []` in `initialize` (`transaction.rb:499`), never reassigned in the class |
| `transaction.rb:595` `@stack.last` (`commit_transaction`)                                                                                                                       | `@stack`     | same                                                                                |
| `transaction.rb:612,616` `@stack.last` ×2 (`rollback_transaction`)                                                                                                              | `@stack`     | same                                                                                |
| `transaction.rb:658` `@stack.size` (`open_transactions`)                                                                                                                        | `@stack`     | same                                                                                |
| `transaction.rb:662` `@stack.last` (`current_transaction`)                                                                                                                      | `@stack`     | same                                                                                |
| `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/connection_pool/queue.rb:94` `@queue.size` (`can_remove_no_wait?`)                             | `@queue`     | `@queue = []` in `initialize` (`queue.rb:17`), never reassigned                     |
| `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:1260` `Array(options[:primary_key]).size != Array(options[:column]).size` | `Array(...)` | `Kernel#Array` always answers an Array                                              |

The TS bodies read `this._stack.length`, `this._stack.at(-1)`, `this._queue.length` and
`wrap(x).length`, and carry `@missingRailsCall size` / `last` in
`packages/activerecord/src/connection-adapters/abstract/transaction.ts` (`beginTransaction`, `commitTransaction`, `rollbackTransaction`,
`openTransactions`, `currentTransaction`), `packages/activerecord/src/connection-adapters/abstract/connection-pool/queue.ts` (`canRemoveNoWait`) and
`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts` (`foreignKeyOptions`).

`prove-hash-literal-ivars-in-ruby-compat-receiver-kinds` (RFC 0123) is the Hash-literal twin of the
ivar half; the mechanism (`hash_typed_ivars`) is the one to widen.

The `activerecord-audit-permanent-receipts-root-a-m` audit (trails#8393) re-tagged one more receipt
onto this story, the same ivar case outside `connection_adapters/abstract/`:
`vendor/rails/v8.0.2/activerecord/lib/active_record/asynchronous_queries_tracker.rb:50` `@stack.last`
(`current_session`), where `@stack = []` in `initialize` (`asynchronous_queries_tracker.rb:46`) is
never reassigned. The TS body is `currentSession` in
`packages/activerecord/src/asynchronous-queries-tracker.ts`, which reads `this.#stack[this.#stack.length - 1]`.

A danger case must stay flagged: an ivar a Relation or association can be assigned to
(`@records`, `@target`) is not provably an Array, so the proof requires every assignment to the ivar
in the class body to be an Array literal (or an `Array(...)` / `[]`-rooted chain), not merely one.

## Acceptance criteria

- [ ] `extract-ruby-api.rb` records receiver kind `array` for an ivar whose every assignment in the class is an Array literal, and for a `Kernel#Array(...)` call receiver, with unit tests for both and for the mixed-assignment case that must stay unproven.
- [ ] The seven receipts above are deleted and `pnpm parity:api:calls` is green with no new row and no baseline row added.
- [ ] No other package gains or loses a call row except by the same proof; list any that move in the PR body.

## Verification

```bash
pnpm vitest run scripts/api-compare && API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api:calls
```
