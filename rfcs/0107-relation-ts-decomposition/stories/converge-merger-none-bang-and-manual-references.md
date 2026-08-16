---
title: "Merger: call none! for a null relation and retire the _manualReferences sidecar"
status: done
updated: 2026-08-16
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6612
claim: "2026-08-16T20:33:34Z"
assignee: "collection-proxy-delegate-query-method-value-readers-to-scope"
blocked-by: null
closed-reason: null
---

## Context

Two trails-only shapes remain in `Merger#merge` after PR #6602 converged the
body onto Rails' generic `NORMAL_VALUES` loop.

### 1. `none!` is spelled as a field poke

Rails:

```ruby
relation.none! if other.null_relation?
```

(`vendor/rails/activerecord/lib/active_record/relation/merger.rb:68`)

trails (`packages/activerecord/src/relation/merger.ts`):

```ts
if (this.other._isNone) rel._isNone = true;
```

`none!` is a real method (`query_methods.rb`, `where!("1=0").extending!(NullRelation)`),
and `null_relation?` is a real predicate; assigning the private `_isNone` field
skips whatever `none!` does beyond setting the flag. Predates #6602 — that PR
carried the line through unchanged because the story scoped to the loop.

### 2. `_manualReferences` sidecar

`references_values` carries a trails-only companion array, `_manualReferences`
(`relation.ts`, `query-methods.ts`), marking which refs a caller asked for
explicitly versus which were inferred from an `includes`. Rails has no such
split: `references!` is `self.references_values |= args` and
`references_values` is the whole story.

Because `references!` does not maintain the sidecar, the `NORMAL_VALUES` loop's
generic `references` step cannot carry it, so #6602 had to propagate it in a
hand-written loop immediately after — the one remaining per-key arm in an
otherwise generic `merge`:

```ts
for (const ref of this.other._manualReferences ?? []) {
  if (!rel._manualReferences.includes(ref)) rel._manualReferences.push(ref);
}
```

The sidecar is also threaded through `and!` / `or!` (`query-methods.rb`
counterparts do only `references_values |= other.references_values`),
`initializeCopy`, and the `references_values` reader that filters it out.

## Acceptance criteria

- `Merger#merge` calls `relation.none!()` guarded by the other relation's
  `null_relation?` predicate (`merger.rb:68`), not a private-field assignment.
  Port `null_relation?` if it has no trails counterpart.
- `_manualReferences` is removed. Establish first what it actually buys —
  trace the `references_values` reader that subtracts it and the
  `includes`-inferred refs it is distinguishing — and converge on Rails'
  single `references_values` (`query_methods.rb`: `references!` is
  `self.references_values |= args`). If some behaviour genuinely depends on the
  split, that behaviour is the divergence to converge, not a reason to keep the
  sidecar.
- The hand-written `_manualReferences` propagation loop in `Merger#merge` is
  deleted, leaving `merge` as the generic loop plus the `merge_*` methods Rails
  has.
- `pnpm parity:api:calls` / `:args` clean; `parity:api:extra` shows no growth;
  `parity:api` / `parity:test` deltas non-negative.
