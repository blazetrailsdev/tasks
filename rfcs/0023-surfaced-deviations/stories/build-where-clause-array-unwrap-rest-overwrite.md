---
title: "build-where-clause-array-unwrap-rest-overwrite"
status: in-progress
updated: 2026-07-03
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4462
claim: "2026-07-03T01:57:49Z"
assignee: "build-where-clause-array-unwrap-rest-overwrite"
blocked-by: null
closed-reason: null
---

## Context

`buildWhereClause` (packages/activerecord/src/relation/query-methods.ts:937-940)
unwraps an array `opts` by APPENDING the incoming `rest` onto the destructured
tail:

    if (Array.isArray(opts)) {
      const [head, ...tail] = opts as unknown[];
      return buildWhereClause.call(this, head, [...tail, ...rest]);
    }

Rails' `build_where_clause` (vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:1616-1618)
instead OVERWRITES `rest` entirely on the array destructure:

    if opts.is_a?(Array)
      opts, *rest = opts
    end

Ruby's `opts, *rest = opts` discards any originally-passed `rest`, while trails
concatenates it. Divergence: `relation.where(["id = ?", 1], 2)` injects the
stray `2` as an extra positional bind in trails (→ arity mismatch /
PreparedStatementInvalid), whereas Rails silently drops the `2` and binds only
`1`.

Surfaced during review of PR #4457
(finder-array-conditions-composite-ambiguity). NOT reachable through that PR's
new call sites: `Base.where`'s array branches drop `rest` before reaching
`buildWhereClause`, and `whereNot`'s array branch calls
`buildWhereClause(conditions)` with no `rest`. It is a pre-existing latent
divergence reachable only if `Relation#where` (or another caller) is invoked
directly with an array first arg PLUS extra positional args.

## Acceptance criteria

- [ ] `buildWhereClause`'s array-unwrap discards the incoming `rest` (mirror
      Ruby `opts, *rest = opts`) instead of appending it, so
      `where(["id = ?", 1], 2)` binds only `1` and drops the stray `2`.
- [ ] Add a test exercising an array first arg + extra positional `rest`
      asserting the trailing arg is dropped, matching Rails.
- [ ] api:compare / test:compare deltas non-negative.
