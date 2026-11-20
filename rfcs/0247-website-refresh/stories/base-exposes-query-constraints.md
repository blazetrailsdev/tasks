---
title: "base-exposes-query-constraints"
status: draft
updated: 2026-11-20
rfc: "0247-website-refresh"
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

Rails defines `query_constraints(*columns_list)` as a public class method on
`ActiveRecord::Persistence::ClassMethods`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/persistence.rb`). trails ports the body as
`queryConstraints` in `packages/activerecord/lib/persistence.ts:239`, but `Base`
(`packages/activerecord/lib/base.ts`) does not expose it as a static, so
`class Comment extends Base { static { this.queryConstraints("blog_id", "id"); } }`
fails to typecheck (TS2551, found writing the Composite Primary Keys guide, trails#10447).

## Acceptance criteria

- [ ] `Base.queryConstraints(...columnsList)` is a typed static wired to the ported function.
- [ ] The Composite Primary Keys guide gains the `queryConstraints` example Rails' guide has.
