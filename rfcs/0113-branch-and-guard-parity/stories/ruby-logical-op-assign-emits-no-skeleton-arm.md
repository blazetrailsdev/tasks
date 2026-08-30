---
title: "ruby-logical-op-assign-emits-no-skeleton-arm"
status: draft
updated: 2026-08-30
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
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

Filed here rather than against RFC 0084: 0084 is superseded (by 0106, itself
superseded by 0123) and refuses new stories, and RFC 0113 is the RFC that reads
the skeleton artifact today. This is a defect in the extraction, not in RFC
0113's arm burndown.

`extract-ruby-api.rb:2392` never emits an `if` arm for a Ruby `||=` / `&&=`:

```ruby
elsif kind == :opassign && SKELETON_LOGICAL_OPS.include?(op_assign_op(node[2]))
```

`op_assign_op` returns Ripper's operator token, which for `@a ||= b` is the
String `"||="` (`[:@op, "||=", …]`). `SKELETON_LOGICAL_OPS` is
`[:"||", :"&&", :and, :or]` — Symbols, and without the `=`. The membership test
can never pass, so the branch is dead and a Ruby memo contributes no control
token at all.

The TS side has no such gap: `isSkeletonLogicalOp`
(`extract-ts-api.ts:3036-3048`) accepts `BarBarEqualsToken`,
`AmpersandAmpersandEqualsToken` and `QuestionQuestionEqualsToken`, so
`this._x ??= …` emits `if`. So does the other faithful spelling,
`if (!this._x) this._x = …`.

Result: every memoised reader in the corpus reports an invented arm. The RFC
0113 noise-floor audit (`docs/infrastructure/arm-mismatch-noise-floor.md`)
found 4 of 80 sampled rows are this defect ALONE — they clear entirely once the
Ruby side emits the arm — and Ruby memos are common enough that its share of
the full 2,718-row population is likely higher.

## Acceptance criteria

- [ ] A Ruby `@x ||= y` / `x &&= y` body emits an `if` token in its skeleton,
      matching what the TS `??=` / `||=` / `&&=` port emits.
- [ ] A unit test over the Ruby extractor pins both operators (and that a
      non-logical op-assign such as `+=` still emits nothing).
- [ ] `pnpm parity:api:arms:report`'s row count DROPS; record the before/after
      in the PR body.
- [ ] No baseline is seeded and nothing new gates — the arms report is
      report-only (RFC 0113 measured it ungated).
