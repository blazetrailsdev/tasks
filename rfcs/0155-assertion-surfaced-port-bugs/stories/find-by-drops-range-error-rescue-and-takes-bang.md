---
title: "find_by / find_by! mirror finder_methods.rb:111-119 (no RangeError rescue, take!)"
status: ready
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while fixing `relation-find-by-bang-no-arguments` (trails#8086).

Rails (`vendor/rails/activerecord/lib/active_record/relation/finder_methods.rb:111-119`):

    def find_by(arg, *args)
      where(arg, *args).take
    end

    def find_by!(arg, *args)
      where(arg, *args).take!
    end

trails (`packages/activerecord/src/relation/finder-methods.ts`, `findBy` / `findByBang`):

- `findBy` wraps `where(...).take()` in a `try` that swallows `ActiveModelRangeError` and returns `null`. Rails has no rescue here. An out-of-range bind is handled upstream: the predicate builder marks the bind unboundable, so the WHERE clause is a contradiction and `take` answers `nil` without a query.
- `findByBang` calls `findBy` and then raises through `raiseRecordNotFoundExceptionBang.call(this.where(...))`, where Rails calls `where(arg, *args).take!`. The body therefore builds the relation twice and never calls `take!`.

## Acceptance criteria

- `findBy` is `return this.where(arg, ...args).take()`, with no RangeError rescue. Out-of-range values reach the unboundable/contradiction path, as in Rails. If a caller still sees `RangeError`, fix that at its raise site.
- `findByBang` is `return this.where(arg, ...args).takeBang()`.
- The `arguments.length === 0` ArgumentError guards added in trails#8086 stay.
- The finder / relations suites stay green, including the out-of-range `find_by` tests in `finder.test.ts`.
