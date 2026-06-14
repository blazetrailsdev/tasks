---
title: "defineEnum bang setters use update_column, not Rails update!"
status: claimed
updated: 2026-06-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-06-14T18:30:35Z"
assignee: "defineenum-bang-uses-update-column-not-update-bang"
blocked-by: null
---

## Context

The standalone `defineEnum(modelClass, …)` function in
`packages/activerecord/src/enum.ts` generates `{name}Bang()` setters (around
lines 176/208/235) that do `writeAttribute` + a conditional
`updateColumn` (Rails `update_column`) only when the record is already
persisted, and return `undefined`.

Rails' enum bang setter is `update!(name => value)`
(`activerecord/lib/active_record/enum.rb:310`), which:

- runs validations and callbacks (`update_column` skips both),
- inserts the record when it is new (the current code only writes in-memory
  for unpersisted records), and
- returns `true`.

Surfaced during review of PR #3216 (which fixed the `_enum` macro and the
dormant `EnumMethods.defineEnumMethods` mirror). The standalone `defineEnum`
path was left untouched there to keep that PR scoped to one story.

## Acceptance criteria

- `defineEnum` bang setters (all three: friendly, canonical, original-form)
  delegate to `update!`/`updateBang({ [attr]: value })` and return its result.
- Tests assert the `true` return value and that an unpersisted record is
  inserted by the bang call, matching Rails.
