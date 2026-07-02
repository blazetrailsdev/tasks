---
title: "exists-raises-on-active-record-instance-arg"
status: claimed
updated: 2026-07-02
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-02T19:21:51Z"
assignee: "exists-raises-on-active-record-instance-arg"
blocked-by: null
closed-reason: null
---

## Context

Surfaced during review of PR #4427 (converge-exists-limit-offset-distinct).
Rails `FinderMethods#exists?` (finder_methods.rb:360-364) raises
`ArgumentError` when passed an ActiveRecord instance:

```ruby
if Base === conditions
  raise ArgumentError, <<-MSG.squish
    You are passing an instance of ActiveRecord::Base to `exists?`.
    Please pass the id of the object by calling `.id`.
  MSG
end
```

trails' `Relation#exists` (packages/activerecord/src/relation.ts ~3554) has no
such guard — passing a model instance falls through to the conditions
case-analysis instead of raising. This predates PR #4427 (present on origin/main
unchanged) and was out of scope for that limit/offset/distinct convergence.

The existing port `finder.test.ts` "exists passing active record object is not
permitted" is currently a stub that only asserts a normal hash lookup works; it
does not exercise the raise. Read the Rails test
(`test_exists_passing_active_record_object_is_not_permitted` in finder_test.rb)
before implementing.

## Acceptance criteria

- [ ] `exists?` raises ArgumentError (Rails message) when passed a Model
      instance, before any query is built.
- [ ] Port the Rails test verbatim so it asserts the raise (replace the stub).
- [ ] Guard placement matches finder_methods.rb ordering (after the `@none` /
      falsey short-circuits, before eager-load routing).
