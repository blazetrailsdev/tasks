---
title: "Memoize eager_loading? as @should_eager_load and clear it in reset"
status: done
updated: 2026-08-17
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6656
claim: "2026-08-17T16:57:56Z"
assignee: "extractor-object-literal-keys-are-not-ported-methods"
blocked-by: null
closed-reason: null
---

## Context

Residue of `converge-promoted-includes-into-eager-loading`, closed by #6648.
That PR retired `_promotedIncludes`, `_includesToPromoteFromReferences`,
`_includesToPromoteFromJoins`, `_joinedIncludesValues` and `_eagerLoadingForSql`
and replaced them with the Rails readers, but shipped `isEagerLoading`
**unmemoized**, which the story's AC ("`eager_loading?` exists as the memoized
boolean") asked for.

`vendor/rails/activerecord/lib/active_record/relation.rb:1237-1242`:

```ruby
def eager_loading?
  @should_eager_load ||=
    eager_load_values.any? ||
    includes_values.any? && (joined_includes_values.any? || references_eager_loaded_tables?)
end
```

`@should_eager_load` is cleared in `Relation#reset`
(`relation.rb:1195-1204`, alongside `@to_sql`, `@arel`, `@loaded`,
`@should_eager_load`, `@cache_keys`, `@cache_versions`, `@records`).

trails' `Relation` getter (`packages/activerecord/src/relation.ts`,
`get isEagerLoading()`) recomputes on every read. The JSDoc on it currently
argues the deviation is observably equivalent — Ruby's `||=` only sticks on a
truthy result, and trails' eager paths mutate `limitValue`/`offsetValue` on the
relation in place, so a stale `true` was the risk being avoided. That is a
justification, not a convergence, and this story exists to remove it.

The real cost is not correctness but work: `referencesEagerLoadedTables()`
builds a throwaway `SelectManager` and runs `buildJoins` on it
(`relation.rb:1470-1478`'s `build_joins([])`), and every `isEagerLoading` read
pays for it — `exec_queries`, `exec_main_query`, `toSql`, `updateAll`,
`deleteAll`, `preloadAssociations`, `exists`, the calculations, `buildFrom` and
`RelationHandler#call` all read it, several of them more than once per query.

## Converged shape

A `#shouldEagerLoad` field memoizing the same expression, cleared in `reset()`
next to the other memos trails already resets there, with `||=` semantics (a
`false` result recomputes, matching Ruby). Verify against the in-place
limit/offset mutation on the eager paths — that is the reason the memo was
skipped, so the story must show either that no eager path mutates a value
`eager_loading?` reads (`eagerLoadValues`, `includesValues`, `joinsValues`,
`referencesValues`), or that the mutating site resets the memo.

## Acceptance criteria

- `Relation#isEagerLoading` memoizes as `relation.rb:1237-1242` does, and
  `reset()` clears the memo as `relation.rb:1195-1204` does.
- The "Not memoized" deviation note is deleted from the getter's JSDoc rather
  than reworded.
- `relation/`, `associations/` and `scoping/` suites pass on all three adapter
  lanes; `pnpm parity:api:calls` / `:args` clean.
