---
title: "Record equality by class+id for assert_equal/assert_includes conversions"
status: claimed
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: "2026-09-25T02:04:15Z"
assignee: "port-ruby-method-arity-for-globalid-locator"
blocked-by: null
closed-reason: null
---

## Context

Rails' `assert_equal record_a, record_b` uses `ActiveRecord::Core#==` (`activerecord/lib/active_record/core.rb`, `==`): same class and same non-nil `id`. In PR #7868 (`has-many-through-*.test.ts`, `join-model.test.ts`) `expect(record).toEqual(other)` and `toContain(record)` deep-compare internal state (`_attributes`, `_newRecord`, `_previouslyNewRecord`, ...), so a record loaded by `find` and the same row from an association read compare unequal. About 30 converged assertions were rewritten to compare `.id` lists or build a one-element array to keep the `includes` kind.

## Acceptance criteria

- A record-equality matcher (or `toEqual` asymmetric handling) compares by class and id like `Core#==`, usable for `assert_equal` and `assert_includes` conversions.
- The id-mapping workarounds in `has-many-through-associations.test.ts`, `has-many-through-disable-joins-associations.test.ts` and `join-model.test.ts` are replaced with direct record assertions.
