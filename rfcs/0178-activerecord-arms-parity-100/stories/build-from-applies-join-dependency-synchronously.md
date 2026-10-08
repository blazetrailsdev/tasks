---
title: "activerecord: build_from applies an eager relation's join dependency synchronously"
status: done
updated: 2026-10-08
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8682
claim: "2026-10-08T15:05:12Z"
assignee: "migration-compatibility-find-stringifies-the-version-in-one-call"
blocked-by: null
closed-reason: null
---

## Context

`QueryMethods#build_from` (`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/query_methods.rb:1783-1796`) is:

```ruby
case opts
when Relation
  if opts.eager_loading?
    opts = opts.send(:apply_join_dependency)
  end
  name ||= "subquery"
  opts.arel.as(name.to_s)
else
  opts
end
```

trails' `buildFrom` (`packages/activerecord/src/relation/query-methods.ts`) calls the async `applyJoinDependency` with a callback, checks whether the callback ran synchronously, and throws `NotImplementedError` when it did not (an eager-loaded relation with limit/offset over a collection association, where Rails runs `distinct_relation_for_primary_key` in line). That is an invented `if`, `try` (the `.catch`) and `throw`, receipted `@inventedArm … — CONVERGEABLE` against this story.

`Relation#toSql` already has the synchronous shape for the same arm: `_buildEagerOperandManager` / `_applyEagerJoinDependency` (`packages/activerecord/src/relation.ts`), which inline the limited-ids query as a subquery and are ratified in CLAUDE.md § "`Relation` is evaluated by an async query". `buildFrom` should reach the eager relation through that synchronous builder, so the body is Rails' two arms and nothing raises.

`relation/eager-load-under-cte-and-from.trails.test.ts` covers the current behaviour.

## Acceptance criteria

- [ ] `buildFrom` tests `opts` with `instanceof ActiveRecord.Relation`, applies the join dependency synchronously in the `eager_loading?` arm, and returns `opts.arel().as(toS(name))`.
- [ ] The `NotImplementedError` raise and the `.catch` are gone; an eager-loaded limited relation used as `from` renders the limited-ids subquery.
- [ ] The three `@inventedArm` receipts on `buildFrom` are deleted and the invented-direction arms report shows no `buildFrom` row.
