---
title: "performCount limit-branch ignores requested aggregate column"
status: closed
updated: 2026-07-06
rfc: "0027-join-dependency-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Resolved: performCount now implements Rails build_count_subquery — calculations.ts projects the requested aggregate column as count_column when column != :all; the DIVERGENCE marker is gone."
---

## Context

Surfaced in review of PR #3477 (RFC 0019 eager.test.ts canonical conversion).
`performCount`'s limit/offset branch
(`packages/activerecord/src/relation/calculations.ts:622-660`) wraps the limited
`SELECT DISTINCT <pk> ... LIMIT/OFFSET` subquery as a derived table and runs
`SELECT COUNT(*) FROM (<subquery>) subquery_for_count`. This is correct for
`count`/`count(:all)`, but it **always counts distinct parent pks** and ignores a
requested aggregate column.

Rails `build_count_subquery` (active_record/relation/calculations.rb:662-678)
rewrites the inner select to `aggregate_column(column_name).as("count_column")`
and counts that alias when `column_name != :all`. So `Post.includes(:comments)
.limit(2).count("comments.id")` should return the distinct-comment count, not the
distinct-post count.

No current limit-branch count test uses a non-`:all` column (and the prior
`pk IN (<subquery>)` form failed on MariaDB anyway), so the divergence is latent.
A `DIVERGENCE:` comment marks the site.

## Acceptance criteria

- [ ] When `column_name != :all`, rewrite the limited subquery's projection to the
      requested `aggregate_column(column)` and count that alias outside (mirror
      Rails `build_count_subquery`).
- [ ] Add a test: eager + limit + `count("<assoc>.id")` returns the distinct
      count of the requested column, verified cross-adapter (incl. MariaDB).
- [ ] Remove the `DIVERGENCE:` note in calculations.ts once converged.
