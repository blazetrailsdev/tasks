---
title: "Timestamp create callback adds a non-Rails _attributeDefinitions guard"
status: draft
updated: 2026-07-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`_assignTimestampsOnCreate` (packages/activerecord/src/callbacks.ts:259-269)
guards each timestamp write with `ctor._attributeDefinitions?.has(col)` before
calling `_writeAttribute`. Rails' `_create_record` (vendor/rails/activerecord/
lib/active_record/timestamp.rb:53-60) writes every attribute returned by
`all_timestamp_attributes_in_model` unconditionally — that list is already
intersected with the model's columns, so no second existence check exists.

The trails guard also has a skew: `_attributeDefinitions` (class-level) can
gain reflected columns AFTER an instance was constructed, so the guard passes
while the instance's AttributeSet lacks the slot — under strict
`_writeAttribute` (PR #5099, RFC 0046) that raises `MissingAttributeError`
mid-callback. This is exactly what broke the encryption suites when the
internal-write bridge was removed (fixed there by declaring the columns on the
bespoke models, PR #5099).

## Acceptance criteria

- [ ] `_assignTimestampsOnCreate` (and the update counterpart if it has the
      same guard) mirrors Rails timestamp.rb: iterate
      `all_timestamp_attributes_in_model` and write, with no extra
      `_attributeDefinitions.has` existence check.
- [ ] No AR CI regressions across sqlite/PG/MySQL.
