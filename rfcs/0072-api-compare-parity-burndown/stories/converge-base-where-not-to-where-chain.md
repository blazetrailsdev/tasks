---
title: "converge-base-where-not-to-where-chain"
status: done
updated: 2026-08-02
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5921
claim: "2026-08-02T20:43:29Z"
assignee: "converge-base-where-not-to-where-chain"
blocked-by: null
closed-reason: null
---

## Context

Classified by `extra-surface-base-accessors-classify` as a category (c)
convergeable divergence — deliberately left counted rather than allowlisted.

`packages/activerecord/src/base.ts:2453` defines `static whereNot(...)` with
three overloads. Rails has no `Model.where_not`: negation is reached through the
zero-argument `where`, which returns a `WhereChain`, and `not` is defined on
that chain at
`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:49`.

Verified: `grep -rn "def where_not" vendor/rails` returns nothing.

trails already has the faithful form on `Relation` —
`packages/activerecord/src/relation.ts:543-570` gives `where()` a zero-arg
`WhereChain` overload — so this is a _missing delegation on Base_, not missing
machinery. `Base.where` (base.ts, around :2410) has no zero-arg overload, which
is why the flattened `Base.whereNot` was invented.

There are ~72 `.whereNot(` call sites under `packages/activerecord/src`, so the
migration is mechanical but wide; that is why this is its own story rather than
part of the classify PR.

## Acceptance criteria

- Give `Base.where()` the zero-argument `WhereChain` overload, mirroring
  relation.ts:543-544, so `Model.where().not(...)` works at the class level as
  Rails' `Model.where.not(...)` does.
- Retire `Base.whereNot` and migrate its call sites (`Relation#whereNot` is a
  separate question — do not touch it in this story unless it also proves to be
  the flattened form).
- NO test renames; call sites change, test titles do not.
- `base.ts` drops one novel extra; record before/after in the PR body.
- Re-run `pnpm parity:api:calls`. Watch the 500 LOC ceiling — if the call-site
  migration cannot fit, land the overload plus a deprecation and register the
  migration as a follow-up story.
