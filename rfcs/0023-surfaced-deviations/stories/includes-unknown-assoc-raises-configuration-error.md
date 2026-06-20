---
title: "includes/eager_load unknown association should raise ConfigurationError not ArgumentError"
status: claimed
updated: 2026-06-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: "2026-06-20T19:13:28Z"
assignee: "includes-unknown-assoc-raises-configuration-error"
blocked-by: null
---

## Context

Rails raises `ActiveRecord::ConfigurationError` (not `ArgumentError`) when
`includes` / `eager_load` is given an association name that does not exist on
the model:

```ruby
Post.includes(:nonexistent_relation)
  .where(nonexistent_relation: { name: "Rochester" }).find(1)
# => ActiveRecord::ConfigurationError:
#    Can't join 'Post' to association named 'nonexistent_relation'; perhaps you misspelled it?
```

trails raises an `ArgumentError` with a similar but non-identical message from
`query-methods.ts`. Surfaced when porting
`test_proper_error_message_for_eager_load_and_includes_association_errors` in
`associations/join-model.test.ts` (wave 5, PR #3617) — test is currently
`it.skip`'d there.

Rails source: `activerecord/lib/active_record/associations/join_dependency.rb`
raises `ActiveRecord::ConfigurationError` in `build`.

## Acceptance criteria

- [ ] `includes` / `eager_load` with an unknown association name raises
      `ConfigurationError` (not `ArgumentError`), with the message
      `"Can't join '<Model>' to association named '<name>'; perhaps you misspelled it?"`.
- [ ] `test_proper_error_message_for_eager_load_and_includes_association_errors`
      in `associations/join-model.test.ts` un-skipped and passing.
