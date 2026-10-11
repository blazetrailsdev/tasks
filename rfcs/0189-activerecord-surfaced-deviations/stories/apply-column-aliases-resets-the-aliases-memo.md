---
title: "activerecord: apply_column_aliases resets the aliases memo; construct_join_dependency's join_type is optional"
status: draft
updated: 2026-10-11
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Left alone by trails#8784, which converged `JoinDependency#initialize`, `base_klass`, `reflections` and `join_root_alias`.

- `applyColumnAliases` (`packages/activerecord/src/associations/join-dependency.ts`) has a line Rails does not: `this._aliasesCache = undefined;`. Rails (`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/join_dependency.rb:153-156`) is

      def apply_column_aliases(relation)
        @join_root_alias = relation.select_values.empty?
        relation._select!(-> { aliases.columns })
      end

  and `aliases` (`:168-181`) memoizes with `@aliases ||=` and is never reset. The reset exists because trails code or tests read `aliases()` before `applyColumnAliases` runs; the test helper `support/join-dependency-aliased-row.ts` does so and now calls `applyColumnAliases` itself first.

- `constructJoinDependency` (`packages/activerecord/src/relation/query-methods.ts`) declares `joinType?: unknown` and casts it. Rails' `construct_join_dependency(associations, join_type)` (`relation/query_methods.rb:1598-1602`) takes two required parameters. `FinderRelation`'s declaration in `relation/finder-methods.ts` already types it as required.

## Converged shape

`applyColumnAliases` is Rails' two statements, with `aliases` memoized once. `constructJoinDependency(associations, joinType)` has two required parameters typed as `JoinDependency`'s constructor takes them, with no cast.

## Acceptance criteria

- [ ] `applyColumnAliases` has no `_aliasesCache` reset; any caller that read `aliases()` before it is fixed at the caller.
- [ ] `constructJoinDependency`'s `joinType` is required and uncast.
- [ ] `associations/eager.test.ts`, `cascaded-eager-loading.test.ts` and the `join-dependency-*.trails.test.ts` files pass; `pnpm parity:api:calls:args` and `pnpm parity:api:params` stay green.
