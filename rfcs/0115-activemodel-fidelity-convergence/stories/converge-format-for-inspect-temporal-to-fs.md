---
title: "converge-format-for-inspect-temporal-to-fs"
status: draft
updated: 2026-08-28
rfc: "0115-activemodel-fidelity-convergence"
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

`formatForInspect` in `packages/activerecord/src/attribute-inspection.ts:66`
mirrors `format_for_inspect`
(`vendor/rails/activerecord/lib/active_record/attribute_methods.rb:527-541`).
Rails' Date/Time arm is `%("#{value.to_fs(:inspect)}")`, which renders
`topics(:first).written_on` as `"2003-07-16 14:28:11.223300000 UTC"`. trails
has no Date/Time arm at all: a `Temporal.Instant` falls through to the
`String(filtered)` default and renders `"2003-07-16T14:28:11.2233Z"`.

Surfaced while converging `attribute_for_inspect with a date`
(`packages/activerecord/src/attribute-methods.test.ts`), whose Rails
counterpart (`attribute_methods_test.rb:98-102`) asserts
`%("#{t.written_on.to_fs(:inspect)}")`. That test currently asserts the
quoted value's own rendering instead, because `Temporal.Instant` has no
`toFs`.

## Acceptance criteria

- [ ] `formatForInspect` grows Rails' Date/Time arm, rendering through
      `to_fs(:inspect)`.
- [ ] `attribute_for_inspect with a date` asserts
      `` `"${t.written_on.toFs("inspect")}"` ``, matching Rails.
- [ ] `pnpm parity:test:assertions` delta non-negative; AR suite green on all
      three lanes.
