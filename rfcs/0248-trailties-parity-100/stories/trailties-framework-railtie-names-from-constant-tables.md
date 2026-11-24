---
title: "trailties-framework-railtie-names-from-constant-tables"
status: draft
updated: 2026-11-24
rfc: "0248-trailties-parity-100"
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

The framework railties hosted in `packages/trailties/lib/trailties/` get their Ruby names through `Object.defineProperty(Trailtie, "name", { value: "…" })` instead of the generated constant tables (`scripts/api-compare/class-paths.ts`): `active-support.ts:243` (`ActiveSupport::Railtie`), `global-id.ts:73` (`GlobalID::Railtie`), `i18n.ts` (`I18n::Railtie`, trails#10715), `action-view.ts:218` (`ActionView::Railtie`), `test-unit/trailtie.ts:34` (`Trails::TestUnitRailtie`), and the others like them. The Ruby files are `activesupport/lib/active_support/railtie.rb`, `active_support/i18n_railtie.rb`, `actionview/lib/action_view/railtie.rb` and so on. parity:api does not pair those files with the trailties files, so the constant tables have no row for them. trails#10715 moved the four package engines (`activestorage`/`actionmailbox`/`actiontext`/`actioncable` `engine.ts`) onto generated tables through `SUBPATH_EXPORT_TABLES`.

## Acceptance criteria

- [ ] Each trailties-hosted framework railtie answers its Rails name through a generated constant-table row, not a `defineProperty` of `name`.
- [ ] No `Object.defineProperty(…, "name", …)` is left under `packages/trailties/lib/trailties/` or `lib/test-unit/trailtie.ts`.
