---
title: "i18n-locale-tag-rfc4646"
status: done
updated: 2026-08-07
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6178
claim: "2026-08-07T16:02:16Z"
assignee: "i18n-locale-tag-rfc4646"
blocked-by: null
closed-reason: null
---

# Port `I18n::Locale::Tag::Rfc4646`

## Context

- `vendor/i18n/lib/i18n/locale/tag/rfc4646.rb` is the alternative
  `I18n::Locale::Tag` implementation — an RFC 4646 subtag grammar
  (`language`, `script`, `region`, `variant`, `extension`, `privateuse`,
  `grandfathered`) with a `Parser` that matches the tag against a regexp and a
  `Rfc4646::Simple`-style `self_and_parents` via `include Parents`.
- `i18n/lib/i18n/locale/tag.rb:6` `autoload`s it alongside `Simple`, but
  `Tag.implementation` defaults to `Simple` (tag.rb:12-14) and nothing in the
  gem selects `Rfc4646`, so `Locale::Fallbacks#compute` never reaches it.
- Story `i18n-backend-fallbacks` ported `tag.rb`, `tag/simple.rb` and
  `tag/parents.rb` (`packages/i18n/src/locale/tag.ts`,
  `locale/tag/simple.ts`, `locale/tag/parents.ts`) because the fallback chain
  walks them; `rfc4646.rb` is registered in
  `scripts/api-compare/unported-files.ts` pointing at this story.

## Acceptance criteria

- `i18n/lib/i18n/locale/tag/rfc4646.rb` is ported to
  `packages/i18n/src/locale/tag/rfc4646.ts`, with
  `i18n/test/locale/tag/rfc4646_test.rb` ported alongside (test names
  verbatim).
- Its `scripts/api-compare/unported-files.ts` entry is deleted, and
  `pnpm parity:api` counts the file for `packages/i18n`.
