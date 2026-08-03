---
title: "Decide and implement Backend::Base#load_rb"
status: ready
updated: 2026-08-03
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`load_rb` was explicitly left undecided by `i18n-backend-file-loading-localize`
("`load_rb` has no JS analogue — decide whether it maps to dynamic `import()`
of a `.js` locale module or is dropped with a `SKIP_GROUPS` entry"). That story
is `done` and the decision was never made, so the gap is live in both signals:

- `pnpm api:compare` — `backend/simple.rb 27/28`, `MISS load_rb → loadRb`
  (the member resolves through `include Base`;
  `vendor/i18n/lib/i18n/backend/base.rb:254`).
- `pnpm test:compare` — `backend/simple_test.rb 28/31`, missing
  `simple load_translations: given a Ruby file name it does not raise anything`
  and `simple load_rb: loads data from a Ruby file`
  (`vendor/i18n/test/backend/simple_test.rb`).

`packages/i18n/src/backend/base.ts:507` documents `loadFile` as delegating to
`loadYml`/`loadJson` only — the `.rb` arm of the gem's dispatch is absent, not
just unimplemented.

(The third missing simple_test case, `store_translations: converts the given
locale to a Symbol`, is unrelated and belongs with whichever story converges
locale normalization — do not fold it in here.)

## Acceptance criteria

- A decision is taken and implemented: either `loadRb` lands on
  `Backend::Base` mapping the `.rb` arm onto a `.js`/`.mjs` locale module
  (raising `UnknownFileType` for anything else, as the gem does), or `load_rb`
  is entered in `SKIP_GROUPS` in `scripts/api-compare/conventions.ts` with a
  reason stating why Ruby file loading has no port.
- If ported: the two `simple_test.rb` cases above are ported with their Rails
  names and the matching `test_data/locales` fixture.
- If skipped: `pnpm test:compare` excludes those two cases through the existing
  mechanism with the same reason, not by renaming trails tests.
- `pnpm api:compare` shows `backend/simple.rb 28/28` (ported) or an unchanged
  denominator of 27 (skipped).
