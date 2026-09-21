---
title: "Drive every ActiveModel::Type through one adversarial value table on both sides"
status: draft
updated: 2026-09-20
rfc: "0000-parity-beyond-name-presence"
cluster: "mri-differential"
packages: []
deps:
  - "mri-differential-harness-spike"
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

A differential harness finds only what its inputs reach, and hand-written fixtures cost as much as the assertion convergence they are meant to replace. The lever is generated input.

The type layer is the best first target: `cast`, `serialize` and `deserialize` are pure, every type shares one interface, and 0155's hits there are all input-shaped: a boolean into Decimal (`decimal-cast-answers-one-for-a-boolean`), a one-element Array into UUID (`uuid-cast-array-stringification`), a `Time` into Date (`date-cast-value-middle-arm-is-instanceof-not-to-date`), an infinite value into the time-zone converter (`time-zone-converter-cast-missing-infinite-arm`), a non-numeric string into Integer (`update-columns-serialize-raw-value`).

## Acceptance criteria

- One committed value table, expressed once and rendered to both languages: `nil`, `true`, `false`, `""`, `" "`, `"abc"`, `"1"`, `0`, `1`, `-1`, `1.5`, a huge Integer, a Symbol, `[]`, a one-element Array, `{}`, a Date, a Time, a DateTime, a TimeWithZone, `Float::INFINITY`, `Float::NAN`.
- Every registered `ActiveModel::Type` is run through `cast` and `serialize` for every row on both sides, and the canonical records are diffed.
- A table row a side cannot express is skipped with a recorded reason, never silently.
- The PR body reports the diff count, and classifies each diff as an already-filed story, a new defect, or a harness artefact.
- New defects are filed with `pnpm tasks new` against 0155 or the package's surfaced-deviations bucket, with both sides' output in the body. They are not fixed in this PR.
