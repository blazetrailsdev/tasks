---
title: "enumerable-free-functions-loop-sites-break-and-nonlocal-return"
status: draft
updated: 2026-10-29
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Left open by `enumerable-free-functions-remaining-loop-sites-after-packing` (which converted `connection_pool.rb:687-689` `@connections.count { }` to ruby-compat `count`). Paths under `vendor/rails/v8.0.2/activerecord/lib/active_record/`:

- `associations/join_dependency/join_association.rb:29` — `each_with_index` with `break`. `packages/activerecord/src/associations/join-dependency/join-association.ts:65` is a `for…of`. `rbBlockCall` (`packages/ruby-compat/src/enumerable.ts`) does not catch `rbIterBreakValue`'s `IterBreak` (`packages/ruby-compat/src/thread.ts:10-23`, only `Thread.eachCallerLocation` does at `:147`), so the free function needs break support first.
- `relation/batches.rb:415` (non-local `return`) and `core.rb:289` `find_by` (`return super`): non-local return out of a block.
- `connection_adapters/postgresql/schema_statements.rb:25` `each_with_object(+"")`: a String memo mutated with `<<`; JS strings are primitives (CLAUDE.md § "Ruby Strings are JS string primitives"), so `createDatabase` (`packages/activerecord/src/connection-adapters/postgresql/schema-statements.ts:117`) needs a cited receipt or a reshaped memo.
- `persistence.rb:616` is already `eachWithObject(Object.entries(attributes), …)` — verify and drop.
- `enum.rb:261` blockless `each_with_index` (`packages/activerecord/src/enum.ts:266`).
- `activesupport/lib/active_support/ordered_hash.rb:30`, and the `each_with_object` / `each_with_index` / `sort_by!` sites outside activerecord.
- `Array#compact` / `Array#sort` in `RECEIVER_KEYED_RUBY_COMPAT_EXPORTS` (`scripts/parity/ruby-compat.ts:126`).

## Acceptance criteria

- [ ] `rbBlockCall` honours `rbIterBreakValue`, and `join-association.ts` uses `eachWithIndex`.
- [ ] Each remaining site uses the ruby-compat free function or carries a cited language-forced receipt.
- [ ] `parity:api:calls` and `:calls:args` stay green with no new baseline rows.
