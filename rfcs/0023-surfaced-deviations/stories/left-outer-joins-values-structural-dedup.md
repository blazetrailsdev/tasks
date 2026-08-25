---
title: "left_outer_joins_values |= dedups hash specs structurally (eql?), not by reference"
status: done
updated: 2026-07-04
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: 4537
claim: "2026-07-04T02:55:34Z"
assignee: "left-outer-joins-values-structural-dedup"
blocked-by: null
---

## Context

`_leftOuterJoins` dedups with `_leftOuterJoinsValues.includes(spec)`
(`packages/activerecord/src/relation.ts`, PR #4342), i.e. JS `===` reference
equality. Rails' `left_outer_joins!` uses `left_outer_joins_values |= args`
(`query_methods.rb:889-891`); Array `|=` dedups by `eql?`/`hash`, which is
**structural** for hashes. So `leftJoins({ posts: "x" })` called twice stores
two structurally-equal hash specs in trails but a single entry in Rails.
(Pre-existing — the prior `.includes` check had the same semantics; flagged in
PR #4342 review as out of scope there.) The sibling `joins` `_joinValues`
union likely has the same reference-vs-structural gap.

## Acceptance criteria

- Dedup `_leftOuterJoinsValues` (and audit the parallel `_joinValues` /
  `_namedInnerJoins` unions) by structural equality for Hash specs, mirroring
  Ruby Array `|=` (`eql?`/`hash`), not reference identity.
- Add a test: `Author.leftJoins({ posts: "comments" }).leftJoins({ posts:
"comments" })` emits a single LEFT OUTER JOIN (no duplicate join).
- Preserve identity dedup for Arel nodes where Rails also dedups by identity.

## Out of scope

- Non-join `|=` union sites unless trivially adjacent.
