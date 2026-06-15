---
title: "Route where.associated/where.missing joins through JoinDependency/AliasTracker instead of the flat string ON-rebind path"
status: blocked
updated: 2026-06-15
rfc: "0005-activerecord-gaps"
cluster: null
deps:
  - unify-alias-tracker-across-join-buckets
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: "2026-06-15T18:06:27Z"
assignee: "route-where-assoc-missing-through-join-dependency"
blocked-by: "Underspecified (empty body) + high-risk. Wholesale JD routing blocked by two obstacles: (1) cross-bucket self-join aliasing — inner joins vs leftOuterJoins use separate per-bucket AliasTrackers, so same-table enum self-joins (where-chain.test.ts 'missing/associated with enum*') collide; needs sibling story unify-alias-tracker-across-join-buckets first. (2) composite-source-PK belongsTo (CpkOrder/CpkShelfBook) can't route through JoinDependency#addAssociation (bails on composite owner PK) and must keep the flat FK-IS-NULL fallback. Re-scope to surgical hybrid (route joinable single-PK cases through JD/AliasTracker, keep flat fallback) and gate full flat-path removal on the sibling story."
---

## Context

## Acceptance criteria
