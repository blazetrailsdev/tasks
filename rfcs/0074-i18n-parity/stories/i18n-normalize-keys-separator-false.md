---
title: "i18n-normalize-keys-separator-false"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6049
claim: "2026-08-04T03:55:55Z"
assignee: "i18n-normalize-keys-separator-false"
blocked-by: null
closed-reason: null
---

## Context

`packages/i18n/src/i18n.ts:395` (`normalizeKeys`) spells Ruby's
`separator ||= I18n.default_separator` (`i18n/lib/i18n.rb:365`) as
`separator ??= defaultSeparator()`.

Ruby's `||=` assigns the default for `nil` **and** `false`; JS `??=` assigns
only for `null` / `undefined`. A caller passing `separator: false` therefore
keeps `false` and every key is split on the string `"false"` instead of the
default separator.

Found while porting `I18n::Backend::KeyValue` (PR #6041), which hit the same
divergence in `Flatten.normalizeFlatKeys` and converged it there
(`i18n/lib/i18n/backend/flatten.rb:25-31`). This one is in a file that PR only
touches for a type parameter, so it is filed rather than swept in.

## Acceptance criteria

- `normalizeKeys` defaults `separator` on `false` as well as `null` /
  `undefined`, matching `||=`.
- The parameter type admits `false`, since that is a value Ruby callers pass.
- A case in `packages/i18n/src/i18n.trails.test.ts` covers
  `separator: false`, and fails on the current code.
- Sweep `packages/i18n/src` for any other `??=` / `??` standing in for a Ruby
  `||=` / `||` and converge or file each.
