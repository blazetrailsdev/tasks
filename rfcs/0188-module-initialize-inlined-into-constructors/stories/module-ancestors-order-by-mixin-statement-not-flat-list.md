---
title: "parity: moduleAncestors orders an include chain by mixinOrder statements, first argument ahead of the second"
status: claimed
updated: 2026-10-14
rfc: "0188-module-initialize-inlined-into-constructors"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-10-14T23:57:42Z"
assignee: "inlined-from-gate-pairs-constructors-as-compare-does"
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/inlined-bodies.ts` `moduleAncestors` walks `klass.prepends` / `klass.includes` as flat lists reversed, so `include A, B` is read as two statements and places `B` ahead of `A`. Ruby places the FIRST argument of one statement ahead of the second (`Module#include` appends in reverse argument order), and only a LATER statement beats an earlier one. The walk also puts every prepend ahead of every include without regard to which module a transitive prepend belongs to.

trails#8810 made `scripts/api-compare/extract-ruby-api.rb` emit `mixinOrder` on each class and module: the `include` / `prepend` / `extend` statements in source order, arguments as written (`scripts/parity/types.ts`, `ClassInfo.mixinOrder`). `scripts/api-compare/lint-inlined-from.ts` `reachedHooks` already reads it for the singleton side (`ClassMethods#new`), but takes the instance side (`#initialize`) from `moduleAncestors`, and so do the call gates through `inlinedSegments` in `compare.ts`.

Rails cases with a multi-argument include reaching an `initialize`: check `rails-api.json` for any `mixinOrder` statement with more than one name whose modules define `initialize` (none verified at filing; `activerecord/lib/active_record/base.rb:283-325` uses one module per statement).

## Acceptance criteria

- `moduleAncestors` orders by `mixinOrder` when the manifest has it: later statement first, first argument of one statement ahead of its second.
- A test in `scripts/api-compare/inlined-bodies.test.ts` covers `include A, B` followed by `include C`, expecting `C, A, B`.
- `pnpm parity:api` totals and `pnpm parity:api:calls` rows are stated before and after; any row that moves is explained.
- `pnpm parity:api:inlined` rejects `initialize` tags written in the old flat-reversed order for a multi-argument include.
