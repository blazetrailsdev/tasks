---
title: "Relation#merge hash-dispatch + proc-arg fidelity (2 impl bugs)"
status: draft
updated: 2026-06-10
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 150
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced during review of PR #3092 (relation-mutation-cluster). The faithful
rewrite of `relation/mutation.test.ts` exposed two pre-existing `Relation#merge`
implementation gaps that the test currently works around (with documented
comments). Both should be fixed, then the test restored to the exact Rails form.

### Bug 1 — `HashMerger.merge()` doesn't dispatch per-key

`relation/merger.ts:150` — `HashMerger.merge()` does
`return this.relation.where(this.hash)`, treating **every** hash key as a WHERE
condition. So `relation.merge!({ select: :foo })` silently becomes a WHERE
filter instead of a select-merge.

Rails (`activerecord/lib/active_record/relation/merger.rb` `HashMerger#other`,
~lines 24-36) builds a fresh relation and dispatches each hash key to its bang
method (`select:` -> `_select!`, arrays splat), then merges via `Merger`:

```ruby
def merge
  Merger.new(relation, other).merge
end
def other
  other = Relation.create(relation.model, table:, predicate_builder:)
  hash.each do |k, v|
    k = :_select if k == :select
    Array === v ? other.public_send("#{k}!", *v) : other.public_send("#{k}!", v)
  end
  other
end
```

Fix: rewrite `HashMerger.merge()` to mirror this — iterate the hash, dispatch
each key to the matching `${k}Bang` (`select` -> `_selectBang`) on a fresh/bare
relation, then `new Merger(this.relation, other).merge()`. Mind the fresh
relation's default scope (Rails uses a bare `Relation.create`, not `all()`).

### Bug 2 — `performMerge` (non-bang `merge`) throws on a proc/function arg

`relation/spawn-methods.ts:29` — `performMerge` passes its arg straight to
`new Merger(this, other)`, which immediately dereferences
`other._whereClause.isEmpty()`. If `other` is a function, this throws
(`undefined.isEmpty`). `mergeBang` already has a `typeof other === "function"`
branch, but the non-bang `merge(fn)` (the form Rails tests) is broken.

Rails `merge!` proc branch is `instance_exec(&other)` (and `merge` spawns
first), returning the proc's evaluated relation. Fix: add a function guard to
`performMerge` mirroring that semantic, then verify against Rails
`RelationMutationTest#test_merge_with_a_proc`.

## Acceptance criteria

- [ ] `HashMerger.merge()` dispatches each hash key to its bang method per Rails
      `HashMerger#other`; `relation.merge!({ select: ... })` merges selects (not
      a WHERE filter). Covered by tests for `select`/`group`/`order` hash merge.
- [ ] `Relation#merge(fn)` (non-bang) handles a proc/function arg without
      throwing, matching Rails' `instance_exec` semantic.
- [ ] Restore `relation/mutation.test.ts` `merge!` to the hash form
      (`merge!({ select: ... })`) and `merge with a proc` to `merge(fn)` (drop
      the documented-workaround comments).
- [ ] `pnpm vitest run` green; no regressions across existing merge callers.
