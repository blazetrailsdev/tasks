---
title: "B4: converge the AR relation cluster"
status: closed
updated: 2026-07-30
rfc: "0084-wide-call-set-burndown"
cluster: api-compare
deps: []
deps-rfc: []
est-loc: 500
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Duplicates work already owned on the same files: 24 open stories in RFC 0023, 5 in RFC 0072, plus 0073 and 0082 all target packages/activerecord/src/relation.ts or relation/. A parallel campaign would produce file-overlap conflicts. Rows become acceptance criteria on the owning stories instead (RFC README survey, 2026-07-30)."
---

## Context

The AR relation cluster is the largest concentration in the wide list:
`relation.ts` alone holds 338 baseline entries (183 projected residual after
noise reduction), plus `relation/query-methods.ts` (~59) and
`relation/calculations.ts` (~48).

Measured examples from the live artifact: `relation.rb` `bind_attribute`
flagged for `model`, `foreign_key`, `read_attribute`, `table`,
`build_bind_attribute`; `create`/`create!` for `collect`,
`current_scope_restoring_block`, `scoping`; `create_or_find_by` for
`with_connection`; `cache_key` for `collection_cache_key`.

This is the most entangled bundle and overlaps existing relation-delegation
work — several entries already carry the reason "Name-collision false positive
(story relation-delegation-rails-named-methods)". Sequenced fourth so the
cheaper bundles validate the approach first.

## Acceptance criteria

- Re-measure with `--report` before planning; expect ~230 rows but verify.
- Check for overlap with in-flight relation-delegation stories before claiming
  any slice — file-overlap conflicts with sibling agents are the main risk here.
- Split into 6–8 PRs, each branching from `main` with non-overlapping files,
  registered as follow-up stories under this RFC. Do NOT fan out PRs from one
  agent.
- Relation behavior verified against `vendor/rails/activerecord/test/cases/relations_test.rb`
  and the calculations/finder test files, not by the ratchet.
