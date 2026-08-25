---
title: "Move default en locale data out of i18n.ts into a locale/en module"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already done: the default en locale data lives in packages/activesupport/src/locale/en.ts and i18n.ts imports it (i18n.ts:34, enPath at :36)."
---

## Context

Rails' default English locale data lives in two files —
`vendor/rails/activesupport/lib/active_support/locale/en.yml` (static data) and
`vendor/rails/activesupport/lib/active_support/locale/en.rb` (the Proc-valued
`number.nth.ordinals` / `ordinalized` entries). trails inlines both inside
`I18nModule#loadDefaults` in `packages/activesupport/src/i18n.ts` (the en.yml
half predates #5954; the en.rb half landed in #5954).

That keeps the data far from the Rails file it mirrors, so parity:api has no
`locale/en.rb` bucket to match against and future locale additions have no
obvious home.

## Acceptance criteria

- The default `en` locale data moves to a module mirroring Rails' layout
  (e.g. `packages/activesupport/src/locale/en.ts`), with `loadDefaults`
  storing it.
- Content is unchanged — pure relocation, no data edits.
- parity:api / parity:api:extra deltas are non-negative (add a file-manifest entry
  if the new path needs one).
- Existing i18n and inflector tests keep passing unchanged.
