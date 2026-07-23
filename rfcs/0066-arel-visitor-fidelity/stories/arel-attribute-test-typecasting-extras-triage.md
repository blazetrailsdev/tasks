---
title: "attribute.test.ts: triage 4 remaining type-casting in-describe extras"
status: done
updated: 2026-07-23
rfc: "0066-arel-visitor-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5115
claim: "2026-07-23T02:07:41Z"
assignee: "arel-attribute-test-typecasting-extras-triage"
blocked-by: null
closed-reason: null
---

# arel-attribute-test-typecasting-extras-triage

## Context

After #5107, `test:compare --package arel` reports
`attributes/attribute_test.rb → attribute.test.ts` at 128/128 matched with
**4 extras** remaining, all inside the `type casting` describe
(`packages/arel/src/attributes/attribute.test.ts:~842-920`): "does not type
cast SqlLiteral nodes", "type casts IN list elements through the attribute",
"type casts NOT IN list elements through the attribute", and "builds Casted
nodes so a null in an IN list casts through the column". Rails' `type casting`
suite (`vendor/rails/activerecord/test/cases/arel/attributes/attribute_test.rb:1123+`)
has only "does not type cast by default" and "type casts when given an
explicit caster". Triage per the established method: any of the 4 duplicating
Rails-shaped coverage elsewhere get deleted; genuinely TS-only ones move to
`attribute.trails.test.ts`.

## Acceptance criteria

- The 4 in-describe extras triaged (deleted or moved to
  attribute.trails.test.ts); extras for the file drop to 0.
- test:compare matched stays 128; no test renamed or reworded.
