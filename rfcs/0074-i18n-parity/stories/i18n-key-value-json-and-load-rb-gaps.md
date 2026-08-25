---
title: "i18n-key-value-json-and-load-rb-gaps"
status: closed
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by i18n-key-value-residual-api-gaps, filed by PR #6060 for the same KeyValue gaps."
---

## Context

`i18n-converge-key-value-api-deferral` deleted the `backend/key_value.rb` and
`backend/flatten.rb` deferrals from `scripts/api-compare/unported-files.ts`, so
`parity:api` now measures `packages/i18n/src/backend/key-value.ts`. That
surfaced three residual gaps it had been hiding
(`scripts/api-compare/output/api-comparison.json`, package `i18n`):

- missing `I18n::JSON.encode` / `I18n::JSON.decode`
  (`vendor/i18n/lib/i18n/backend/key_value.rb:9-18`), plus the matching
  inheritance mismatch `I18n::JSON` → `ts-class-missing`. `key-value.ts:10-12`
  documents the deviation: the gem's `I18n::JSON` is `Oj` or
  `ActiveSupport::JSON` depending on what is installed, and trails uses the
  JS-language `JSON`, whose `stringify` / `parse` are that `encode` / `decode`.
  Either port a `JSON` class with `encode` / `decode` delegating to the global
  `JSON` (the faithful shape — Rails devs read `I18n::JSON.encode`), or record
  the deviation where parity:api reads it (`SKIP_GROUPS` in
  `scripts/api-compare/conventions.ts`) with that reason.
- missing `load_rb` on `I18n::Backend::KeyValue`
  (`vendor/i18n/lib/i18n/backend/base.rb:254`, reached through
  `include Base`). trails spells it `loadJs` in
  `packages/i18n/src/backend/base.ts` because a translations file in trails is
  a `.js` file, not a `.rb` file. The rename is deliberate but is not
  registered in `conventions.ts`, so it counts as missing on every backend that
  includes `Base`.

## Acceptance criteria

- `I18n::JSON`'s `encode` / `decode` and the `ts-class-missing` inheritance
  mismatch are converged (preferred) or registered in `conventions.ts` with a
  reviewed reason — not left unaccounted.
- `load_rb` → `loadJs` is registered as a name translation or skip in
  `scripts/api-compare/conventions.ts` (regenerating
  `docs/ruby-ts-conventions.md`), or converged.
- `pnpm parity:api` i18n matched counts do not regress; the i18n missing count
  drops by 3 and inheritance returns to 7/7.
