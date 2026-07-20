---
title: "Converge resolveAliasedColumn onto resolveAliasNameIn"
status: draft
updated: 2026-07-20
rfc: "0023-surfaced-deviations"
cluster: null
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

PR #4980 added `resolveAliasNameIn` (`packages/activemodel/src/attribute-methods.ts`):
Rails' `attribute_aliases[name] || name` step plus a trails-only camelCase-key
bridge, guarded so the camelized key never displaces a name the relevant
attribute set already owns.

`resolveAliasedColumn` (`packages/activerecord/src/reflection.ts:150-166`) now
implements the same alias + camelize lookup, minus the ownership guard:

```ts
const aliases = modelClass?._attributeAliases ?? {};
return aliases[name] ?? aliases[camelize(name, "lower")] ?? name;
```

PR #4980 removed its use inside `AbstractReflection#hasCachedCounter`, but retained
the function for its remaining caller on the associations counter-update write
path (`associations.ts:3501`), which does real column-name resolution rather
than a `has_attribute?` check. Collapsing it was called out as a follow-up in
the #4980 description but deliberately left out to keep that PR bounded.

Note this is not a pure textual dedup: the associations caller resolves a
column name for SQL, so the correct `present` set for the ownership guard needs
deciding (likely the target model's attribute definitions, since the write
targets a real column). Verify against the counter-cache suites — the aliased
counter column (`posts.legacy_comments_count`) is the live case.

## Acceptance criteria

- [ ] `resolveAliasedColumn` is either reimplemented in terms of
      `resolveAliasNameIn` or deleted in favour of it, with the correct
      `present` set chosen and justified for the associations write path.
- [ ] `reflection.trails.test.ts:307-309` coverage is preserved or migrated.
- [ ] Counter-cache suites (`counter-cache.test.ts`,
      `counter-cache.trails.test.ts`) pass unchanged.

## Rails source

- trails: `packages/activerecord/src/reflection.ts:150-166` — `resolveAliasedColumn`
- trails: `packages/activerecord/src/associations.ts:3501` — remaining caller
- trails: `packages/activemodel/src/attribute-methods.ts` — `resolveAliasNameIn`
- Rails has no counterpart: `Arel::Table#[]` (table.rb:84) resolves aliases directly because Rails' alias keys are already snake_case
