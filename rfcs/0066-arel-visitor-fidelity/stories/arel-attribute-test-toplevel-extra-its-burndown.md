---
title: "attribute.test.ts: triage 52 TS-only top-level its (delete dups, move TS-only to trails file)"
status: done
updated: 2026-07-23
rfc: "0066-arel-visitor-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 5107
claim: "2026-07-23T01:03:25Z"
assignee: "arel-attribute-test-toplevel-extra-its-burndown"
blocked-by: null
closed-reason: null
---

## Context

After #5066, `test:compare --package arel` reports
`attributes/attribute_test.rb → attribute.test.ts` at 128/128 matched with
**52 extras (TS only)**. Describe-count parity with Rails is now exact, so the
remaining extras are top-level `it()`s in
`packages/arel/src/attributes/attribute.test.ts` (roughly lines 900-1240 post-
merge) that restate coverage already inside the Rails-shaped describes — e.g.
"gteq generates >=", "in generates IN", "should handle nil for eq",
"eqAny generates OR group", plus a few genuine TS-only behaviors
("in with empty array generates 1=0", math-node compatibility its).

Per the established method (see memory feedback: TS-only extras belong in
`*.trails.test.ts`, bespoke duplicates get DELETED): duplicates of in-describe
assertions should be deleted; genuinely TS-only behaviors move to
`attribute.trails.test.ts`.

## Acceptance criteria

- Top-level stray its in attribute.test.ts triaged: duplicate ones deleted,
  TS-only ones moved to attribute.trails.test.ts.
- test:compare matched stays 128; extras drop substantially from 52.
- No test renamed or reworded.
