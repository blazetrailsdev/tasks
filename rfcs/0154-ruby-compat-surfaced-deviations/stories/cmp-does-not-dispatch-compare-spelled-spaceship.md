---
title: "cmp-does-not-dispatch-compare-spelled-spaceship"
status: draft
updated: 2026-09-25
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

Surfaced in review of trails#8087, which added ruby-compat's `sort` (Ruby `Array#sort`, `vendor/ruby/array.c:3473` / `sort_2` `:3301`) over `cmp`.

`cmp` (`packages/ruby-compat/src/comparable.ts:79`) is Ruby's `a <=> b`. It dispatches to the receiver's own `<=>` only when that is spelled `compareTo` (`isComparable`) or `cmp` (`isCmpSpelling`). The repo's settled spelling for a ported `<=>` is `compare`: `ActiveRecord::Core#<=>` (`activerecord/lib/active_record/core.rb:665`) is `compare` in `packages/activerecord/src/core.ts:169`. `cmp` never reaches it, so it falls through to `rb_obj_cmp` (`rbEqual(a, b) ? 0 : null`).

Consequence: `sort([topic2, topic1])` for two unequal records of the same class raises `ArgumentError: comparison of Topic with Topic failed`. In Ruby, `base_test.rb:660-664` (`test_comparison_with_same_class`, not yet ported through `sort`) gets `[topic_1, topic_2]`, ordered by id.

## Acceptance criteria

- `cmp` dispatches to a receiver's `compare` method as its `<=>`, alongside `compareTo` / `cmp`. Audit every instance `compare` in the repo first, so only true `<=>` ports are reached.
- The `base_test.rb:660-664` port sorts with ruby-compat `sort` and asserts `[topic1, topic2]`.
