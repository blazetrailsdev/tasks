---
title: "Move default en locale data out of i18n.ts into a locale/en module"
status: draft
updated: 2026-08-03
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
closed-reason: null
---

## Context

Rails' default English locale data lives in two files —
`vendor/rails/activesupport/lib/active_support/locale/en.yml` (static data) and
`vendor/rails/activesupport/lib/active_support/locale/en.rb` (the Proc-valued
`number.nth.ordinals` / `ordinalized` entries). trails inlines both inside
`I18nModule#loadDefaults` in `packages/activesupport/src/i18n.ts` (the en.yml
half predates #5954; the en.rb half landed in #5954).

That keeps the data far from the Rails file it mirrors, so api:compare has no
`locale/en.rb` bucket to match against and future locale additions have no
obvious home.

## Acceptance criteria

- The default `en` locale data moves to a module mirroring Rails' layout
  (e.g. `packages/activesupport/src/locale/en.ts`), with `loadDefaults`
  storing it.
- Content is unchanged — pure relocation, no data edits.
- api:compare / api:extra deltas are non-negative (add a file-manifest entry
  if the new path needs one).
- Existing i18n and inflector tests keep passing unchanged.
