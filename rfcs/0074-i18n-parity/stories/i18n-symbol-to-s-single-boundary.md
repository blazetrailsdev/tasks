---
title: "Route Ruby Symbol#to_s through one place instead of three toS copies"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6052
claim: "2026-08-04T12:44:44Z"
assignee: "i18n-symbol-to-s-single-boundary"
blocked-by: null
closed-reason: null
---

# Route Ruby `Symbol#to_s` through one place instead of three `toS` copies

## Context

- A Ruby Symbol value is a colon-prefixed JS string (`":errors.format"`).
  Wherever such a value is then used as a _translate key_, Ruby's
  `normalize_keys` calls `to_s` on it (`vendor/i18n/lib/i18n/i18n.rb`
  `normalize_key`, via `Symbol#to_s`), which drops the colon.
- PR #6031 spelled that conversion as a file-private `toS` helper in three
  files: `packages/i18n/src/exceptions.ts` (for
  `MissingTranslation#normalized_option`, `vendor/i18n/lib/i18n/exceptions.rb:73`),
  `packages/activemodel/src/translation.ts` (the `defaults.shift()` key,
  `activemodel/lib/active_model/translation.rb:32`) and
  `packages/activemodel/src/error.ts` (the same shift at
  `activemodel/lib/active_model/error.rb:98` and `:131`).
- Rails has one conversion, in `normalize_key`. Three copies of it is three
  places to forget: any new caller that pulls a `":key"` default out of a
  chain and passes it as a key silently looks up a key with a leading colon.

## Acceptance criteria

- The colon-stripping `to_s` lives at the single boundary Rails puts it at —
  `normalizeKey` / `normalizeKeys` in `packages/i18n/src/i18n.ts` — or, if that
  is shown to break a legitimate literal `":foo"` String key, at one shared
  spelling the three call sites import.
- The three private `toS` copies are deleted.
- `pnpm vitest run packages/i18n packages/activemodel` stays green, and the
  AR validations files that exercise the error-message chains stay green.
