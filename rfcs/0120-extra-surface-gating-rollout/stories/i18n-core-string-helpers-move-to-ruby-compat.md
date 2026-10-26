---
title: "i18n-core-string-helpers-move-to-ruby-compat"
status: claimed
updated: 2026-10-26
rfc: "0120-extra-surface-gating-rollout"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: "2026-10-26T18:59:10Z"
assignee: "activerecord-test-support-extra-surface-burndown-remainder"
blocked-by: null
closed-reason: null
---

## Context

Found auditing i18n's `@noRailsEquivalent` receipts while enrolling i18n in the
extra-surface gate (`burn-down-and-enroll-i18n`, RFC 0120).

Two i18n exports stand in for Ruby core methods, not for anything the i18n gem
defines. **ruby-compat already holds the MRI-cited port of both** — i18n is
carrying hand-rolled duplicates, so this story is a swap and a delete, not a
new port. Do not write `rbStrTr`.

- `tr` (`packages/i18n/src/backend/flatten.ts:30`) is `String#tr`, called at
  `vendor/i18n/v1.14.8/lib/i18n/backend/flatten.rb` (`escape_default_separator`,
  `normalize_flat_keys`) and `backend/base.rb` (`load_file`'s `type.tr('.', '')`).
  ruby-compat's port is `trTrans` in `packages/ruby-compat/src/string/tr.ts`,
  with `trnext` (`vendor/ruby/v3.3.11/string.c:7866`) for `a-z` ranges and
  backslash quoting and `trSetupTable` (`:8236`) for a `^` complement. i18n's
  ten-line `map`/`indexOf` handles none of those, and is only correct because
  all three call sites pass single characters. `tr.ts` is already reached from
  the package index — `export { strCount } from "./string/tr.js"`
  (`packages/ruby-compat/src/index.ts:405`) — but `trTrans` is not in that
  export list yet.
- `toSym` (`packages/i18n/src/i18n.ts:294`) is `String#to_sym` / `Symbol#to_sym`
  under the repo's ":name" Symbol convention. ruby-compat holds it twice, both
  exported from the index: `stringToSym` (`src/symbol.ts:45`, `rb_str_intern`
  on a known String, a byte-identical body) and `toSym` (`src/object.ts:981`),
  the `obj.to_sym` send cited to `vendor/ruby/v3.3.11/symbol.c:862` and
  `symbol.rb:8`. The send is the matching receiver type for i18n's 17 call
  sites, which pass `unknown`.

i18n's `toSym` is also a silent divergence: for a non-string it answers
`` `:${String(value)}` `` where Ruby, and ruby-compat's `toSym`, raises
`NoMethodError`. Converging it is a behaviour change on that arm; check the
`locale`-valued call sites (`backend/flatten.ts:129,142`, `backend/simple.ts:43`,
`exceptions.ts:50`) and the i18n tests before assuming no caller relies on the
coercion. If one does, that caller is what is wrong.

Both were tagged `@noRailsEquivalent PERMANENT`, but a Ruby core method has a
home: ruby-compat. Neither is a TypeScript language shortcoming, so both are now
`CONVERGEABLE` against this story.

## Acceptance criteria

- `trTrans` joins the `./string/tr.js` export line in
  `packages/ruby-compat/src/index.ts`. No new ruby-compat port is written.
- i18n's `tr` and `toSym` are deleted along with their receipts, and their 3 and
  17 call sites call ruby-compat's `trTrans` and `toSym`.
- Any call site relying on the old `toSym`'s non-string coercion is fixed at the
  call site, not by reintroducing a coercing wrapper.
- i18n's extra-surface `allowed` mark is tightened down
  (`pnpm parity:api:extra:tighten`).
