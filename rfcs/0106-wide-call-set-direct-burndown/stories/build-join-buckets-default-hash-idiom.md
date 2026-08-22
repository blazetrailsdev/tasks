---
title: "build-join-buckets-default-hash-idiom"
status: done
updated: 2026-08-22
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6866
claim: "2026-08-22T17:34:58Z"
assignee: "build-join-buckets-default-hash-idiom"
blocked-by: null
closed-reason: null
---

## Context

Split out of `query-methods-order-only-call-inversions` (RFC 0106).

`build_join_buckets` opens with `buckets = Hash.new { |h, k| h[k] = [] }`
(`activerecord/lib/active_record/relation/query_methods.rb:1826`) — a
constructor call, before `select_named_joins` at `:1830`. The port
(`packages/activerecord/src/relation/query-methods.ts:3279-3288`) spells the
auto-vivifying Hash as a pre-seeded object literal with the four bucket keys,
which emits no constructor, so the shard's first TS constructor is the
`new Nodes.StringJoin` further down and the gate reports
`order:selectNamedJoins,constructor`.

There is no settled trails idiom for Ruby's default-block `Hash` today
(`join_dependency.rb:108-114`, `pool_manager.rb:7` and
`test_fixtures.rb:123` are the other instances), so this is a repo-wide idiom
decision, not a local one.

## Acceptance criteria

- [ ] A settled spelling for `Hash.new { |h, k| h[k] = [] }` is chosen (or the
      row is retired another way), and `build_join_buckets` uses it.
- [ ] The `build_join_buckets` / `order:selectNamedJoins,constructor` baseline
      row is deleted; `pnpm parity:api:calls` green.
