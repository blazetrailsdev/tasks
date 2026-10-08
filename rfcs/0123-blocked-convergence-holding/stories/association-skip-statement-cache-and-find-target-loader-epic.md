---
title: "activerecord: port Association#skip_statement_cache? and cut the find_target loader convergence into stories"
status: draft
updated: 2026-10-08
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Replaces `port-base-association-find-target-body`, closed as FALSIFIED in the
2026-10-08 blocked-story triage: it was scoped as a 250-line body port, and the
base machinery does not exist.

Rails' `Association#find_target`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/association.rb:248-270`)
builds `scope`, consults `skip_statement_cache?` (`:391`) and runs the
association scope cache. trails has no `skipStatementCache`, and the three
subclass `findTarget` overrides do not call a shared base body: each delegates
to a standalone functional loader
(`singular-association.ts:444`, `has-many-association.ts:514`,
`has-one-through-association.ts:732`, plus `has-many-through-association.ts`),
about 3,300 lines that never build the scope or statement cache.
`super.findTarget()` at `has-many-through-association.ts:51` resolves to
HasManyAssociation's override, not the base. Line anchors are from 2026-08 and
need refreshing.

This story is the first step only.

## Acceptance criteria

- `Association#skipStatementCache` is ported from `association.rb:391` with its
  Rails body.
- A follow-up story per loader is filed (singular, has_many, has_one through,
  has_many through), each converging that loader onto `scope` /
  `association_scope_cache` / `get_bind_values`, and a last one collapsing them
  into the base `find_target` body.
- `inline-has-many-module-private-find-target-loader` is checked against that
  list and merged into it or wired as a dep.
