---
title: "belongs-to-residual-skip-burndown"
status: ready
updated: 2026-07-23
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`test:compare --package activerecord --incomplete` counts 13 skipped matched
tests in `associations/belongs-to-associations.test.ts` — the largest residual
skip cluster (Rails: `vendor/rails/activerecord/test/cases/associations/belongs_to_associations_test.rb`).
Current `it.skip`s at: :287 (where on polymorphic association with cpk), :309
(missing attribute error ... no foreign key attribute), :311 (belongs to does
not use order by), :640 (should set composite foreign key ... key changes),
:708 (reload the belonging object with query cache), :1039 (touch option on
touch without updated at attributes), :1365 (proxy should not respond to
private methods — likely permanent, Ruby visibility), :1412 (invalid dependent
option raises), :1414/:1416 (dependency should halt parent destruction /
cascaded three levels), :1680/:1682 (should set foreign key on save/save!),
:1810 (multiple counter cache with after create update).

For each: read the Rails test, un-skip if portable and fix the underlying gap;
if genuinely JS-impossible (e.g. Ruby method-visibility probes), reclassify as
permanent-skip so it leaves the counted denominator. May split by theme (cpk /
dependency-halt / fk-on-save) if the fixes exceed ~500 LOC.

## Acceptance criteria

- Each of the 13 is either passing un-skipped or explicitly reclassified with
  call-site justification.
- `--incomplete` Skip count for belongs_to_associations_test.rb reaches 0.
