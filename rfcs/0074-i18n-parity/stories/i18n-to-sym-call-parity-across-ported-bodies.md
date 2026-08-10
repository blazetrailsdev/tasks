---
title: "Port to_sym at the five ported bodies whose Ruby counterpart calls it"
status: done
updated: 2026-08-07
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6177
claim: "2026-08-07T15:38:12Z"
assignee: "datetime-sf-is-a-number-not-a-rational"
blocked-by: null
closed-reason: null
---

## Context

`Backend::Simple#storeTranslations` was the first ported body in `packages/i18n`
to answer Ruby's `to_sym` (PR #6093, `simple.rb:42`). It was ported INLINE
(`isSymbol(locale) ? locale.slice(1) : String(locale)`) rather than as a named
`toSym` helper, because naming it lit up five wide-ratchet rows at once — every
other ported body whose Ruby counterpart calls `to_sym` and whose TS body does
not:

- `packages/i18n/src/backend/base.ts` `translate` — `vendor/i18n/lib/i18n/backend/base.rb:38-40`
- `packages/i18n/src/backend/simple.ts` `lookup` — `vendor/i18n/lib/i18n/backend/simple.rb:99-100` (`_key = _key.to_s.to_sym`)
- `packages/i18n/src/backend/flatten.ts` `flattenKeys` — `vendor/i18n/lib/i18n/backend/flatten.rb`
- `packages/i18n/src/interpolate/ruby.ts` `interpolate` / `interpolateHash` — `vendor/i18n/lib/i18n/interpolate/ruby.rb:33-43`

Each of those is a real omission on its own terms: the Ruby body normalizes a
key or locale through `to_sym` and the TS body indexes with whatever it was
handed. Today they mostly agree because a trails `Locale` / key is already a
plain string (`locale/tag/simple.ts:35`), so `"en"` and `:en` key the same
bucket — they diverge exactly where a `":en"`-spelled Symbol reaches them, which
is the convention in CLAUDE.md and `[[i18n-symbol-values-are-colon-strings]]`.

The inline spelling in `storeTranslations` is itself the debt this story should
retire: one shared `toSym` at the boundary, not N inline conditionals.

## Converged shape

A single `to_sym` counterpart in `packages/i18n/src/i18n.ts` next to
`normalizeKeys`, called from each site above in the Rails position, and
`storeTranslations`' inline conditional replaced by a call to it. Expect the
five wide-ratchet rows to resolve rather than be baselined — CLAUDE.md forbids
widening an allowlist for this.

## Acceptance criteria

- Each of the five bodies above calls the shared normalizer where its Ruby
  counterpart calls `to_sym`; `simple.ts:91`'s inline conditional is replaced.
- `pnpm parity:api:calls` gains no rows and no `to_sym` row is baselined.
- A test covers a `":en"`-spelled Symbol reaching each site and keying the same
  entry as the plain string, per `[[i18n-store-translations-locale-to-sym]]`.
