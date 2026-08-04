---
title: "Stop pre-stripping the Symbol colon in backend/base.ts default and localize arms"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6055
claim: "2026-08-04T13:42:04Z"
assignee: "backend-base-symbol-arms-pre-strip-colon"
blocked-by: null
closed-reason: null
---

## Context

PR #6052 moved the Ruby `Symbol#to_s` colon drop to the single boundary Rails
puts it at — `normalizeKey` in `packages/i18n/src/i18n.ts`
(`vendor/i18n/lib/i18n.rb:447`) — and deleted three private `toS` copies.

Two colon-stripping call sites in `packages/i18n/src/backend/base.ts` remain,
and they are the same class of divergence:

- `backend/base.ts:424` — the Symbol arm of `#default`
  (`vendor/i18n/lib/i18n/backend/base.rb`, `when Symbol then I18n.translate(subject, ...)`).
  Rails passes the Symbol through untouched and lets `normalize_key` do the
  `to_s`; ours calls `subject.slice(1)` first.
- `backend/base.ts:342` — `#localize`'s Symbol `format` arm
  (`vendor/i18n/lib/i18n/backend/base.rb`, `I18n.t(:"#{type}.formats.#{format}", ...)`).
  Rails interpolates the Symbol into the key, which stringifies to its name;
  ours pre-strips with `key.slice(1)`.

Both were out of scope for #6052 (which was scoped to the three named `toS`
copies) but they are the same "second place that converts a Symbol" the story
existed to eliminate.

## Acceptance criteria

- `backend/base.ts` passes the Symbol-spelled value straight through to
  `translate` / the interpolated key, with no local `.slice(1)`; `normalizeKey`
  is the only place the colon is dropped.
- `packages/i18n` tests stay green, as do the AR validations/i18n files that
  exercise the default chains.
