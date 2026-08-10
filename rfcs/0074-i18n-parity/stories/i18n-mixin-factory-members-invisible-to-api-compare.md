---
title: "Make Backend::Fallbacks mixin members visible to parity:api"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6093
claim: "2026-08-04T21:11:10Z"
assignee: "i18n-date-parse-eu-us-gate-misses-have-digit"
blocked-by: null
closed-reason: null
---

# Make `Backend::Fallbacks`' mixin members visible to `parity:api`

## Context

- `packages/i18n/src/backend/fallbacks.ts` ports
  `i18n/lib/i18n/backend/fallbacks.rb` as a class factory
  (`export function Fallbacks<T extends BackendConstructor>(Superclass: T)`),
  because Ruby's `include I18n::Backend::Fallbacks` overwrites `translate`,
  `exists?` and `resolve_entry` and calls `super` from each — and
  `include()` / `Included<>` from `@blazetrails/activesupport` copies members
  onto a prototype with no `super` to call.
- The extractor does not see members declared on the class expression inside
  that factory. `pnpm parity:api --package i18n --missing` reports
  `backend/fallbacks.rb 4/5` with `- on_fallback → onFallback` missing;
  `translate`, `resolveEntry` and `exists` only score because they resolve by
  bare short name against `backend/base.ts`. `on_fallback` has no `Base`
  counterpart (fallbacks.rb:114), so it drops out.
- The member is correct as written — `protected`, mirroring the gem's
  `private def on_fallback` (fallbacks.rb:111-116). Making it public to satisfy
  the matcher would be the unfaithful fix, so the gap is in the extractor.

## Acceptance criteria

- `scripts/api-compare/extract-ts-api.ts` attributes members of a class
  expression returned from an exported factory function to that factory's
  file, so `backend/fallbacks.rb` scores 5/5 and the three shortname-resolved
  members pair with `backend/fallbacks.ts` rather than `backend/base.ts`.
- No visibility change in `packages/i18n/src/backend/fallbacks.ts`.
