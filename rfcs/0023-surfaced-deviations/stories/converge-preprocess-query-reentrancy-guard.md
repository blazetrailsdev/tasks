---
title: "Remove or relocate the preprocessQuery re-entrancy guard Rails does not have"
status: draft
updated: 2026-07-29
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`preprocessQuery`
(`packages/activerecord/src/connection-adapters/abstract/database-statements.ts:1927-1944`)
wraps the transformer loop in a `_inQueryTransformers` re-entrancy guard stored
on the adapter host: if the flag is already set, it clears it and returns `sql`
**without running any transformer at all**.

Rails has no such guard. `preprocess_query`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:575-587`)
does the write checks and then runs the loop unconditionally:

```ruby
ActiveRecord.query_transformers.each do |transformer|
  sql = transformer.call(sql, self)
end
```

The guard is a trails invention, surfaced (not introduced) while converging
`queryTransformers` onto the `ActiveRecord` accessor in PR #5565 — that PR
deliberately left it untouched as out of scope. Its observable effect is that a
transformer which itself issues a query (or any nested `preprocessQuery` call on
the same adapter) causes the _outer_ SQL to skip tagging entirely, and it leaves
the flag toggled in a way that depends on nesting depth. Whatever hazard it was
added for should be identified before removal — if it guards a real infinite
recursion (e.g. `QueryLogs` reading from the DB), the fix is likely at the
transformer, not in `preprocess_query`.

## Acceptance criteria

- Determine what the `_inQueryTransformers` guard was protecting against
  (git-blame the line; check whether any shipped transformer re-enters).
- If nothing re-enters, delete the guard so `preprocessQuery` matches Rails
  line-for-line; add a regression test that a nested `preprocessQuery` still
  tags the outer SQL.
- If a real recursion exists, move the protection to the offending transformer
  and record the reason at the call site per the deviation convention.
