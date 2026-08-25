---
title: "Audit the cross-file / mixin-attribution bucket (1606 rows)"
status: done
updated: 2026-07-31
rfc: "0083-wide-call-ratchet-noise-reduction"
cluster: api-compare
deps: []
deps-rfc: []
est-loc: 120
pr: 5725
claim: "2026-07-31T17:27:11Z"
assignee: "audit-wide-cross-file-mixin-attribution"
blocked-by: null
closed-reason: null
---

## Context

Rails attributes a mixed-in module's methods to the INCLUDING class's file, so
`PostgreSQL::SchemaStatements` methods are attributed to
`postgresql_adapter.rb` and name-matched against `postgresql-adapter.ts`. trails
ports those bodies into sibling collaborator files
(`postgresql/schema-statements-class.ts`) that Rails has no counterpart for and
that are therefore never paired. `isDelegatingWrapper` (`compare.ts:318-320`)
rescues only ≤3-call forwarders; anything larger is charged with the whole
mixin's Rails call set.

Under the conservative receiver-scoping rule this bucket is **1606 rows** — the
second-largest lever in the RFC and the only one where tooling artifact and real
divergence are genuinely mixed. Widening candidate resolution blindly would
suppress real fidelity gaps.

This story is an audit only. No code changes.

## Acceptance criteria

- An audit report committed under the RFC directory (sibling precedent:
  `rfcs/0080-api-compare-jsdoc-metadata/tag-audit.md`) classifying all
  cross-file rows into: (a) pure mixin-attribution artifact — the Rails method's
  body IS ported, in a sibling collaborator file reachable from the paired
  class; (b) real divergence — the call is genuinely not made anywhere in the
  port; (c) unported.
- The classification is reproducible: the script that produced it is committed
  alongside, or the report states the exact query against `output/ts-api.json`.
- The report states, per bucket, how many rows and which files dominate.
- The report recommends the exact resolution rule for
  `resolve-wide-candidates-through-include-graph`, including what it must NOT
  resolve through.
- No baseline change; expected row delta 0.
