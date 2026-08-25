---
title: "i18n-backend-fallbacks"
status: done
updated: 2026-08-03
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6029
claim: "2026-08-03T21:38:09Z"
assignee: "i18n-backend-fallbacks"
blocked-by: null
closed-reason: null
---

# Port `I18n::Backend::Fallbacks` (and the locale chain it walks)

## Context

- `vendor/rails/../i18n/lib/i18n/backend/fallbacks.rb` (gem) and
  `i18n/lib/i18n/locale/fallbacks.rb` — neither is ported. `packages/i18n`
  has `Simple` and `Base` only, so a lookup against `"en-US"` never falls
  through to `"en"`.
- The pre-gem `activemodel/src/i18n.ts` shim emulated this with a bespoke
  `setFallbacks()`; that shim was deleted by story
  `i18n-consolidate-activemodel-activerecord-shims`, and with it the emulation.
- `packages/activerecord/src/validations/i18n-generate-message-validation.test.ts`
  has the one case that needs it, currently `it.skip`:
  `"activerecord attributes scope falls back to parent locale before it falls
back to the :errors namespace"`. Rails builds its backend for that file as
  `class Backend < I18n::Backend::Simple; include I18n::Backend::Fallbacks; end`
  (activerecord/test/cases/validations/i18n_generate_message_validation_test.rb:7-9).
- `packages/activesupport/src/i18n.ts` notes the same gap in its header.

## Acceptance criteria

- `i18n/backend/fallbacks.rb` and `i18n/locale/fallbacks.rb` are ported into
  `packages/i18n`, with `i18n/test/backend/fallbacks_test.rb` and
  `i18n/test/locale/fallbacks_test.rb` ported alongside (names verbatim).
- The AR case above is unskipped and passes unchanged; the skip comment is
  removed.
