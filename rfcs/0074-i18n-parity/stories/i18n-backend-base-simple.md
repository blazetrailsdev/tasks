---
title: "Port I18n::Backend::Base + Simple + Utils"
status: done
updated: 2026-08-03
rfc: "0074-i18n-parity"
cluster: null
deps: ["i18n-package-scaffold-config-exceptions"]
deps-rfc: []
est-loc: 450
priority: 2
pr: 5980
claim: "2026-08-03T14:45:47Z"
assignee: "i18n-backend-base-simple"
blocked-by: null
closed-reason: null
---

# Port I18n::Backend::Base + Simple + Utils

## Context

- `vendor/i18n/lib/i18n/backend/base.rb` — `translate`, `exists?`,
  `store_translations` contract, `lookup` (abstract), `resolve(_entry)`,
  `default`, `pluralize` (`:zero`/`:one`/`:other` via `pluralization_key`),
  `interpolate` hook, `subtrees?`.
- `vendor/i18n/lib/i18n/backend/simple.rb` — `initialized?`,
  `store_translations` (deep merge, symbolize), `available_locales`,
  `reload!`, `eager_load!`, `translations`, `lookup` (key-path dig with
  `default_separator`).
- `vendor/i18n/lib/i18n/utils.rb` — `deep_merge(!)`, `except`,
  `deep_symbolize_keys`.

Trails has two divergent hand-rolled SimpleBackends to eventually replace:
`packages/activesupport/src/i18n.ts:34-56` and the translation store in
`packages/activemodel/src/i18n.ts`. Depends on the scaffold story.

## Acceptance criteria

- `packages/i18n/src/backend/base.ts` and `backend/simple.ts` mirror the gem
  layout; `packages/i18n/src/utils.ts` for Utils.
- Pluralization data errors raise `InvalidPluralizationData`; missing
  translations flow through `MissingTranslation` machinery, matching
  `base.rb` semantics (throw/raise/default resolution order).
- Unit tests ported from the shapes in `vendor/i18n/test/backend/simple_test.rb`
  (names kept identical for future test-compare matching).
