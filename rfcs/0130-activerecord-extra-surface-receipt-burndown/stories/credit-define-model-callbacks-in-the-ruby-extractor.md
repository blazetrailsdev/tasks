---
title: "Credit define_model_callbacks-generated names in the Ruby extractor so a faithful callback port stops scoring novel"
status: draft
updated: 2026-08-30
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages:
  - activerecord
deps: []
deps-rfc: []
est-loc: 180
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

16 of activerecord's 342 novel names are callback macros —
`afterCreate`, `afterDestroy`, `afterFind`, `afterSave`, `afterTouch`,
`afterUpdate`, `aroundCreate`, `aroundDestroy`, `aroundSave` and their
siblings, most of them on `base.ts` (19 novel total, so these are the bulk of
that file).

They are not extra surface. Rails generates them at load time from
`define_model_callbacks` (`activemodel/lib/active_model/callbacks.rb:141-154`,
called from `activerecord/lib/active_record/callbacks.rb`), so there is no
`def after_create` anywhere in the `.rb` for `extract-ruby-api.rb` to find, and
`extra-surface.ts` scores the faithful TS port as invented. Writing a
`@noRailsEquivalent` on them would assert something false about a correct port
— the RFC's route 2, not route 3 or 4.

This is the same extractor blind spot #7193 closed for Ruby Hash-constant and
option-hash keys: the fix is to credit the generator's output as Ruby-side
names, once, in `scripts/api-compare/extract-ruby-api.rb`, and it lowers the
count for every package that mixes the concern in — activemodel included, which
matters when that package gets its own enrollment RFC.

Sized and ordered early because it is a single mechanical credit that clears a
whole class, and because leaving it until phase 6 would tempt `base.ts`'s story
into writing 16 receipts that should never exist.

## Acceptance criteria

- `extract-ruby-api.rb` credits the names `define_model_callbacks` emits
  (`before_*`, `around_*`, `after_*` per declared event) as Ruby-side names on
  the file that calls the macro, the way #7193 credits Hash-constant keys.
- The 16 activerecord names above no longer appear in
  `pnpm parity:api:extra --package activerecord --novel-only`, and no
  `@noRailsEquivalent` tag is written for any of them.
- No name is credited that the macro does not actually generate — a test in
  `scripts/api-compare/` pins both the positive and the negative cases, since a
  too-generous credit silently disarms the gate for every `after*` name in the
  repo.
- The measured effect on every other package is reported in the PR body
  (activemodel and activesupport both mix the concern in); marks move only via
  `:tighten`.
