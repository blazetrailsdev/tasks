---
title: "i18n-backend-interface-store-translations"
status: done
updated: 2026-08-03
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6011
claim: "2026-08-03T19:39:43Z"
assignee: "i18n-backend-interface-store-translations"
blocked-by: null
closed-reason: null
---

## Context

`packages/i18n/src/config.ts`'s `Backend` interface — the slice `Config#backend`
hands out — declares `availableLocales`, `reloadBang`, `eagerLoadBang`,
`translate`, `exists` and `localize`, but not `storeTranslations`.

In the gem there is no such slice: `I18n.backend` is a backend, and
`store_translations` is part of `I18n::Backend::Base`
(`vendor/i18n/lib/i18n/backend/base.rb:22-25`) alongside the other five. The
omission is observable — `i18n/test/api/simple_test.rb` and the localization
mixins call `I18n.backend.store_translations(...)`, and
`packages/i18n/src/backend/localization.test.ts` (PR #6004) had to keep its own
reference to the `Simple` instance because `config().backend.storeTranslations`
does not typecheck.

## Acceptance criteria

- `storeTranslations` is on the `Backend` interface, matching `Base`'s
  signature (`locale`, `data`, `options`).
- Test setup reaches translations through `config().backend`, as the gem's
  tests do, rather than holding a separate backend reference.
