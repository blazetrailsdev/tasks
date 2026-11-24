---
title: "i18n-pluralization-included-late-wins"
status: claimed
updated: 2026-11-24
rfc: "0248-trailties-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-24T02:59:56Z"
assignee: "activestorage-index-import-loads-blob-eagerly"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.5.2/railties/test/application/configuration_test.rb:4652-4676` "i18n custom exception handler in initializer and
pluralization backend" runs `I18n.backend.class.include(I18n::Backend::Pluralization)` after boot. In Ruby the module sits above
`I18n::Backend::Base` in `Simple`'s ancestors, so `Pluralization#pluralize` wins. In trails `include(I18n.backend().constructor,
I18n.Pluralization)` does not replace the `pluralize` `Simple` already answers (`packages/i18n/lib/backend/pluralization.ts`), so
`I18n.t("apples", { count: 0 })` answers "more than one" where Rails answers "one or none".

## Acceptance criteria

- Including `Pluralization` into the Simple backend after load makes its `pluralize` win, as Ruby's ancestor chain does.
- The test is ported into `packages/trailties/test/application/configuration.test.ts` and passes.
