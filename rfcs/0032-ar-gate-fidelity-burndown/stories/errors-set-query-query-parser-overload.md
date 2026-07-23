---
title: "errors-set-query-query-parser-overload"
status: claimed
updated: 2026-07-23
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-23T12:19:37Z"
assignee: "errors-set-query-query-parser-overload"
blocked-by: null
closed-reason: null
---

## Context

Found by per-entry wide-call verification. Rails defines two `set_query`
overloads in errors.rb: the plain assign
(vendor/rails/activerecord/lib/active_record/errors.rb:213-220, ported at
packages/activerecord/src/errors.ts:268-275) and the subclass overload
(errors.rb:275-289) that, when `@query_parser` is set, rebuilds the exception
with `**@query_parser.call(sql)` parsed details (used by StatementInvalid
subclasses to enrich errors with table/column extraction). Trails has no
query_parser machinery at all.

## Acceptance criteria

- Port the query_parser-aware `set_query` overload and the class-level
  query-parser wiring it reads, or close won't-do with a written rationale
  if the consuming Rails feature is out of trails' scope.
