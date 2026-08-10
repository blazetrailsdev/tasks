---
title: "Port store_translations' locale.to_sym and its missing Rails test"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6093
claim: "2026-08-04T21:11:10Z"
assignee: "i18n-date-parse-eu-us-gate-misses-have-digit"
blocked-by: null
closed-reason: null
---

## Context

`backend/simple_test.rb` sits at **30/31** in `pnpm parity:test` — the single
remaining gap is `simple store_translations: converts the given locale to a
Symbol` (`vendor/i18n/test/backend/simple_test.rb:138-141`). PR #6043 and its
parent story (`i18n-backend-load-rb-decision`) both explicitly scoped this out
as belonging to whichever story converges locale normalization; nothing else in
`0074-i18n-parity` covers it, so it is filed here.

Behind the missing test is a real line-for-line omission. Rails:

```ruby
# vendor/i18n/lib/i18n/backend/simple.rb:36-46
def store_translations(locale, data, options = EMPTY_HASH)
  if I18n.enforce_available_locales &&
    I18n.available_locales_initialized? &&
    !I18n.locale_available?(locale)
    return data
  end
  locale = locale.to_sym                            # <-- :42, not ported
  translations[locale] ||= Concurrent::Hash.new
  data = Utils.deep_symbolize_keys(data) unless options.fetch(:skip_symbolize_keys, false)
  Utils.deep_merge!(translations[locale], data)
end
```

trails (`packages/i18n/src/backend/simple.ts:71-87`) reproduces every line of
that body **except** `locale = locale.to_sym` — it indexes `translations` with
the raw `locale` argument. The guard arm, the `||=`, the `skip_symbolize_keys`
fetch and the deep merge are all present and faithful.

Whether the omission is observable today depends on what reaches the method: a
trails `Locale` is a plain JS string, so `"en"` already keys the same bucket a
Ruby `:en` would. It becomes observable the moment a call site hands in a
colon-prefixed Symbol spelling (`":en"`, the convention in
`[[feedback_ruby_symbol_values_are_colon_prefixed_strings]]` and CLAUDE.md) or a
non-string locale — those land in a _separate_ bucket in trails and the same one
in Rails. Either way the normalization step is missing from a ported body, which
is a fidelity miss on its own terms.

## Acceptance criteria

- `storeTranslations` (`packages/i18n/src/backend/simple.ts:71`) gains the
  ported counterpart of `locale = locale.to_sym` (`simple.rb:42`), in Rails'
  position — after the `enforce_available_locales` guard, before
  `translations[locale] ??= {}` — so the merge target is the normalized key.
  Use the settled trails spelling for a Ruby Symbol locale rather than inventing
  a new normalizer; if a helper already exists for this (check
  `normalizeKeys` / the locale handling in `packages/i18n/src/i18n.ts`), reuse it.
- The Rails test is ported under its exact name, `simple store_translations:
converts the given locale to a Symbol`, asserting the same shape as
  `vendor/i18n/test/backend/simple_test.rb:138-141` — that storing under a
  string locale is readable as the symbol-keyed entry, i.e. one bucket, not two.
- Verify the test **fails on baseline** before the `to_sym` port lands (if it
  passes either way, say so in the PR — the port is still correct, but the test
  is not a regression guard and should not be described as one).
- `pnpm parity:test` shows `backend/simple_test.rb` **31/31**.
- `pnpm parity:api` i18n stays at or above 183/184; `pnpm parity:api:calls` and
  `pnpm parity:api:calls` gain no new rows.

## Out of scope

Any broader locale-normalization campaign (`I18n.locale=` coercion, the
`Locale` type itself, fallbacks tag parsing). This story is the one omitted
line and the one missing test.
