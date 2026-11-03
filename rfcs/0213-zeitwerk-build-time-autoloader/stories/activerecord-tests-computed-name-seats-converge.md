---
title: "activerecord tests: converge computed-name constSet seats onto Rails' named or anonymous classes"
status: in-progress
updated: 2026-11-03
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#9654
claim: "2026-11-03T03:16:42Z"
assignee: "activerecord-tests-computed-name-seats-converge"
blocked-by: null
closed-reason: null
---

## Context

trails#9647 replaced `registerModel` in activerecord tests with `constSet(TopLevel, …)`. About 50 sites seat through a computed name (`constSet(TopLevel, klass.name, klass)` in helper functions such as `counter-cache.test.ts:82`, `dup.test.ts:16`, `persistence.test.ts:105`, `transactions.test.ts:56`, `uniqueness-validation.test.ts:93`, and `forEach((m) => …)` loops in `inverse-associations.test.ts`). They are found with `git grep -nE 'constSet\(TopLevel, [a-z]\w*\.name'`. These sites:

- do not call `DescendantsTracker.registerSubclass`, the `inherited` half of the Ruby `class` keyword (`vendor/rails/v8.0.2/activesupport/lib/active_support/descendants_tracker.rb`, `vendor/rails/v8.0.2/activerecord/lib/active_record/inheritance.rb:287-294`), which `registerModel` used to do;
- seat whatever `.name` answers, so a namespaced canonical model passed to a helper is seated under a bare name that Rails never defines.

In Rails each such class is either a named constant (`class Foo < ActiveRecord::Base` in the test) or an anonymous `Class.new(ActiveRecord::Base)` that is never seated.

## Acceptance criteria

- Each computed-name site is converged on the Rails test it mirrors: a literal `constSet(TopLevel, "Foo", Foo)` plus `DescendantsTracker.registerSubclass(Parent, Foo)` where Rails names the class, and no seat where Rails' class is anonymous or is already a canonical model seated by its own file.
- No `constSet(TopLevel, <expr>.name, …)` remains in activerecord tests except `use-fixtures.ts`.
- No test names change.
