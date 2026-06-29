---
title: "Add assert_not_called_on_instance_of-equivalent helper; strengthen preload-avoids-reader test"
status: done
updated: 2026-06-29
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 4265
claim: "2026-06-29T12:10:12Z"
assignee: "assert-not-called-on-instance-of-helper"
blocked-by: null
---

## Context

Surfaced while converging `eager.test.ts` "preloading has_many_through
association avoids calling association.reader" to canonical (wave H, PR #4258).

Rails asserts the _mechanism_ directly:

```ruby
test "preloading has_many_through association avoids calling association.reader" do
  assert_not_called_on_instance_of(ActiveRecord::Associations::HasManyAssociation, :reader) do
    Author.preload(:readonly_comments).first!
  end
end
```

(`vendor/rails/activerecord/test/cases/associations/eager_test.rb:1646-1650`)

trails has no `assert_not_called_on_instance_of` equivalent, so the ported test
(`packages/activerecord/src/associations/eager.test.ts`) uses a _behavioral
approximation_: `Author.preload("readonlyComments")`, then assert the through
target `isLoaded()` and that reading it fires no queries. This catches a
preloaded-but-re-querying regression but does NOT verify the preloader avoids
the `HasManyAssociation#reader` code path itself — a refactor that routes
preloading back through `reader` (while still populating the target) would pass.

## Acceptance criteria

- Add a test helper that asserts a named method is NOT invoked on any instance
  of a given class during a block (spy/proxy over the prototype method),
  mirroring Minitest's `assert_not_called_on_instance_of`.
- Strengthen the eager.test.ts "preloading has_many_through association avoids
  calling association.reader" test to assert `reader` is not called on
  `HasManyThroughAssociation` (or the trails equivalent) during
  `Author.preload("readonlyComments").first()`, matching Rails verbatim.
- Keep the existing behavioral assertions or replace them with the mechanism
  assertion; test name unchanged.
- No `node:` or `process.` references; async fs only.
