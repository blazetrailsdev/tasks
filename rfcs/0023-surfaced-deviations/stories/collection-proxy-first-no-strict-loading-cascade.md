---
title: "CollectionProxy#first cascades strict loading via toArray() instead of running LIMIT 1 (Rails parity)"
status: in-progress
updated: 2026-06-29
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 4273
claim: "2026-06-29T13:58:13Z"
assignee: "collection-proxy-first-no-strict-loading-cascade"
blocked-by: null
---

## Context

Surfaced while converging `strict-loading.test.ts` onto the canonical schema (PR #4206).

Rails `strict_loading_test.rb` line 105–108 (`test_strict_loading_n_plus_one_only_mode_does_not_eager_load_child_associations`):

```ruby
assert_nothing_raised do
  developer.projects.first.firm
end
```

In Rails, `CollectionProxy#first` runs `SELECT ... LIMIT 1` without calling `load_target`. The returned record is NOT passed through `set_strict_loading`, so it carries no cascaded strict-loading flag and `project.firm` does not raise.

In trails, `CollectionProxy#first` calls `toArray()` → `_execLoad()` → `_cascadeStrictLoading(results)`, which calls `setStrictLoading` on every returned record. In n_plus_one_only mode the cascaded projects get `strictLoadingBang()` (all-mode), so `project.firm` would raise `StrictLoadingViolationError`. The `first.firm` assertion from Rails is therefore not portable to TS without fixing this path.

Relevant TS files:

- `packages/activerecord/src/collection-proxy.ts` — `first()` / `toArray()` / `_execLoad()`
- `packages/activerecord/src/associations.ts` — `_cascadeStrictLoading`
- `vendor/rails/activerecord/lib/active_record/associations/collection_proxy.rb` — `first` uses `take` / `LIMIT 1` SQL

## Acceptance criteria

- `CollectionProxy#first(n)` runs a `LIMIT n` query (or reads from the in-memory target when loaded), matching Rails' `first` implementation.
- The returned record(s) do NOT have strict loading cascaded onto them via `setStrictLoading` when `first` is used.
- `test_strict_loading_n_plus_one_only_mode_does_not_eager_load_child_associations` can assert `developer.projects.first.firm` does not raise (restoring the omitted Rails assertion).
- Existing `first`-related tests remain green.
