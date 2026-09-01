---
title: "activemodel: review time-value.ts fast_string_to_time's placeholder baseline row"
status: ready
updated: 2026-09-01
rfc: "0134-activemodel-surfaced-deviations"
cluster: rails-deviation
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/call-mismatches-exclude/activemodel/type/helpers/time-value.json`
holds one row (`fast_string_to_time` → missing `new`) whose reason is the
generic RFC 0126 "pre-existing divergence newly VISIBLE to the gate … pending
per-body convergence review" placeholder — i.e. nobody has actually compared
the body.

Do the per-body review: `vendor/rails/activemodel/lib/active_model/type/helpers/time_value.rb`'s
`fast_string_to_time` constructs via `::Time.new(...)` /
`Time.utc_or_local`; `packages/activemodel/src/type/helpers/time-value.ts`'s
`fastStringToTime`. Either converge the construction to the closest trails
`Time` call set (the `@blazetrails/date` Time mirrors MRI's), or — if the
Temporal/date-gem surface genuinely has no `new` — replace the placeholder
with a real one-line reason or a `@missingRailsCall new — PERMANENT` tag at
the site and delete the row.

## Acceptance criteria

- The row is either deleted (converged) or carries a specific reviewed reason
  / site tag; the placeholder text is gone either way.
- `type/helpers/time-value.test.ts` green; regex/parse behavior pinned
  against MRI (`ruby` is on PATH) for at least the fractional-seconds and
  offset arms.

## Notes

Do **not** confuse this with
`0115-activemodel-fidelity-convergence/stories/port-time-value-type-cast-for-schema.md`
(status: done, PR #6788). That story ported `time_value.rb`'s
`type_cast_for_schema` (`to_fs(:db).inspect`); it did not touch
`fast_string_to_time`'s construction call, which is what this story reviews.
Its sibling `converge-time-value-helper-to-a-real-mixin` (also done, #6788)
made the file a real mixin but likewise did not review this body.

Adjacent open story in 0023: `drop-fast-string-to-date-newline-guard` — the
same family of parse-path divergences; check it before starting so the two do
not collide in the same file.
