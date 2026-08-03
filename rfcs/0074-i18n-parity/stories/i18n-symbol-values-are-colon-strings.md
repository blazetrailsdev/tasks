---
title: "i18n-symbol-values-are-colon-strings"
status: done
updated: 2026-08-03
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6032
claim: "2026-08-03T22:41:09Z"
assignee: "i18n-symbol-values-are-colon-strings"
blocked-by: null
closed-reason: null
---

## Context

`packages/i18n/src/backend/base.ts` and `packages/i18n/src/backend/simple.ts`
model Ruby Symbol _values_ — a `default` that names another translation key, and
a translation entry that links to one — as real JS symbols (`Symbol.for("some.key")`),
per the convention stated in `base.ts`'s file header.

That is the wrong spelling for this repo: a Ruby Symbol is a JS string, and JS
`Symbol` / `Symbol.for` is reserved for private keys and brands (see the
"Symbols vs strings" bullets in CLAUDE.md). Where the control flow turns on
`Symbol === x`, the Symbol keeps its leading colon in the string (`":short"`),
which is also how it renders through `inspect`.

- `packages/i18n/src/backend/base.ts` — `symbolName`, the `typeof key === "symbol"`
  arm in `translate` (`vendor/i18n/lib/i18n/backend/base.rb:44`), and the
  `typeof subject === "symbol"` arm in `resolve` (`base.rb:230-240`).
- `packages/i18n/src/backend/simple.ts:122-140` — `lookup`'s symbol key arm and
  the symbol-entry link arm (`vendor/i18n/lib/i18n/backend/simple.rb:53-70`).
- `localize` / `translate_localization_format` already use the colon spelling
  (PR #6004); this story converges the rest of the two files so they carry one
  convention.

## Acceptance criteria

- No `Symbol` / `Symbol.for` remains in `packages/i18n/src` for a Ruby Symbol
  value; `":name"` strings replace them, in source and in tests.
- `base.ts`'s file header states the colon convention instead of the JS-symbol one.
- The gem's `default` / link behaviour is unchanged: a `":other.key"` default
  resolves through the backend, a plain `"other.key"` string is returned literally.
