---
title: "store_link and resolve_link normalize the locale through to_sym"
status: done
updated: 2026-08-07
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6186
claim: "2026-08-07T17:44:45Z"
assignee: "flatten-store-resolve-link-to-sym-parity"
blocked-by: null
closed-reason: null
---

## Context

PR #6177 (story `i18n-to-sym-call-parity-across-ported-bodies`) added a shared
`toSym` to `packages/i18n/src/i18n.ts` and called it from the five ported bodies
that story enumerated. Two more ported bodies in the same file call `to_sym` in
Ruby and still do not:

- `vendor/i18n/lib/i18n/backend/flatten.rb:89-91`

  ```ruby
  def store_link(locale, key, link)
    links[locale.to_sym][key.to_s] = link.to_s
  end
  ```

  `packages/i18n/src/backend/flatten.ts:179-183` keys `this.links()` with the
  raw `locale` and never normalizes it.

- `vendor/i18n/lib/i18n/backend/flatten.rb:93-94`

  ```ruby
  def resolve_link(locale, key)
    key, locale = key.to_s, locale.to_sym
  ```

  `packages/i18n/src/backend/flatten.ts:185-187` reads `this.links()` with the
  raw `locale`, and does not apply `key.to_s` either.

Both bodies already have `toS` imported in the file for the `link.to_s` /
`key.to_s` halves, so only the `to_sym` half is missing. They were left out of PR
PR #6177 deliberately — that story's acceptance criteria named exactly five bodies
and CLAUDE.md forbids widening scope mid-PR — not because they are correct.

The divergence is the same one the five had: a `":en"`-spelled Symbol and the
plain string `"en"` key two different buckets of the links map, so a link
stored under one spelling is invisible to a lookup under the other.

## Converged shape

`storeLink` and `resolveLink` call `toSym(locale).slice(1)` where Ruby calls
`locale.to_sym`, exactly as the five converged sites do — `toSym` answers the
`":en"` Symbol spelling and `.slice(1)` takes its name, which is what trails'
string-keyed maps hold (CLAUDE.md, `[[i18n-symbol-values-are-colon-strings]]`).
`resolveLink` also applies `String(key)` for the `key.to_s` half.

## Acceptance criteria

- [ ] `storeLink` and `resolveLink` normalize `locale` through the shared
      `toSym`, and `resolveLink` applies `key.to_s`.
- [ ] A test stores a link under `":en"` and resolves it under `"en"` (and the
      reverse), reaching the same entry.
- [ ] `pnpm parity:api:calls` gains no row and no `to_sym` row is baselined — these
      two should RESOLVE rows, so delete the stale baseline entries by hand
      rather than reseeding.
