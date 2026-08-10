---
title: "Load JS/TS locale modules in place of Backend::Base#load_rb"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6043
claim: "2026-08-04T02:10:53Z"
assignee: "i18n-backend-load-rb-decision"
blocked-by: null
closed-reason: null
---

## Context

`load_rb` was left undecided by `i18n-backend-file-loading-localize`
("`load_rb` has no JS analogue — decide whether it maps to dynamic `import()`
of a `.js` locale module or is dropped with a `SKIP_GROUPS` entry"). PR #5995
(`feat(i18n): port Backend::Base translation-file loading`) took the _drop_
half provisionally: `scripts/api-compare/conventions.ts:445-456` carries a
scoped-skip group for `load_rb` whose reason argues that a `.js` locale module
"would be new public surface the gem has no counterpart for", and
`packages/i18n/src/backend/base.ts:17` repeats that in prose.

**This story reverses that half of the decision.** The gem's `.rb` arm exists so
a locale file can be _executable source in the host language_ — pluralization
rules, interpolated defaults, computed keys. Dropping it leaves trails with
YAML/JSON only and no way to express those, which is a fidelity loss, not a
fidelity-neutral omission. The port keeps the _capability_ and drops only the
Ruby: trails loads `.ts` / `.js` / `.mjs` locale modules whose default export is
the same locale-keyed hash `load_rb`'s `eval` returns.

`load_rb` itself is still never implemented as such — there is no Ruby to
`eval` — so the api-compare scoped skip stays; only its reason changes.

Rails source ported: `vendor/i18n/lib/i18n/backend/base.rb:236-262`
(`load_file` extension dispatch, `load_rb`, `load_yml`, `load_json`) and
`I18n::UnknownFileType`. Tests: `vendor/i18n/test/backend/simple_test.rb:79-81`
(`load_translations: given a Ruby file name it does not raise anything`) and
`:88-91` (`load_rb: loads data from a Ruby file`).

Both signals are currently short:

- `pnpm parity:api` — `backend/simple.rb 27/28`, `MISS load_rb → loadRb`
  (the member resolves through `include Base`).
- `pnpm parity:test` — `backend/simple_test.rb 28/31`, missing the two
  `.rb` cases above.

The constraint that shapes the design: `loadFile`
(`packages/i18n/src/backend/base.ts:536`) is **synchronous** — it dispatches on
extension to a `load<Type>` method and expects `[data, keysSymbolized]` back —
while `import()` is async. Reading is already solved this way for YAML/JSON:
the async `preloadTranslationFiles`
(`packages/i18n/src/backend/base.ts:84`) fills a cache and the sync loaders read
from it, with `packages/i18n/src/backend/base.ts:123` raising a directed error
when the preload was skipped. Module loading must use the same seam.

Development and production have to be served by one seam, not two code paths:

- **Development** — locale module paths are only known at runtime from
  `I18n.load_path`; `preloadTranslationFiles` resolves each `.ts`/`.js`/`.mjs`
  entry with a dynamic `import()` and caches the module namespace.
- **Production / bundled** — a bare `import(someRuntimeString)` is opaque to
  bundlers and dead-ends in a bundle. A registration seam
  (mirroring the existing `registerFileReader`, see
  `packages/i18n/src/backend/base.file-loading.trails.test.ts:12`) lets an app
  hand in already-imported modules keyed by path, so the bundler sees static
  imports and the preload finds the module in the registry without ever calling
  `import()`.

(The third missing simple_test case, `store_translations: converts the given
locale to a Symbol`, is unrelated and belongs with whichever story converges
locale normalization — do not fold it in here.)

## Acceptance criteria

- `loadFile`'s extension dispatch gains `.ts` / `.js` / `.mjs` arms backed by a
  loader that returns the module's default export as `[data, false]`, and
  raises `InvalidLocaleData` when that export is not a hash — matching the
  post-dispatch checks `load_rb` results are subject to at
  `vendor/i18n/lib/i18n/backend/base.rb:240-252`. Every other extension still
  raises `UnknownFileType`.
- `preloadTranslationFiles` resolves those extensions ahead of the sync path,
  using a pre-registered module if one was supplied and a dynamic `import()`
  otherwise. Loading a module-typed entry with neither registration nor preload
  raises the same directed "await `I18n.preloadTranslationFiles()`" error as the
  YAML/JSON path (`packages/i18n/src/backend/base.ts:123`), not a bare
  `UnknownFileType`.
- The registration seam is exercised by a trails-only test proving a bundled app
  can load a locale module with `import()` never called.
- The two `simple_test.rb` cases above are ported under their Rails names with
  a `.ts` (or `.js`) fixture standing in for `en.rb`, asserting the same
  `{ en: { fuh: { bah: "bas" } } }` shape.

### Amended 2026-08-04 — superseded in part by #6017

PR #6017 (`feat(i18n): register Active Support's en locale on I18n.load_path`)
landed the first four criteria above while this story was open, with two design
choices that supersede what this story originally specified. The amendments:

- **Dispatch is `.js` only, not `.ts`/`.js`/`.mjs`.** `load_rb` has exactly one
  Ruby counterpart (`vendor/i18n/lib/i18n/backend/base.rb:254-256`), so one
  ported arm is the faithful mapping; extra arms would be extra surface with no
  Ruby name behind them. A locale module authored in TypeScript is registered
  under its _emitted_ `en.js` name, which is what
  `packages/i18n/src/test-data/locales/en.ts` does.
- **The seam is `registerLocaleModule` (singular), not `registerLocaleModules`.**
- **The api-compare criterion is inverted: `load_rb` must MATCH, not stay
  skipped.** The original bullet — "keep the scoped skip, rewrite its reason" —
  is the anti-pattern CLAUDE.md's "a documented deviation is debt, not
  permission" forbids: closing a convergence story by writing a better
  justification for the deviation. `SCOPED_SKIP_GROUPS` is a burndown ledger.
  #6017 instead took the converged route, adding an `rb: "js"` entry to
  `TOKEN_RENAMES` in `scripts/api-compare/conventions.ts` so `load_rb` resolves
  to the ported `loadJs` as a real match — the same mechanism as the existing
  `erb` → `tse` rename, and published in the CI-verified generated table in
  `docs/ruby-ts-conventions.md`. No scoped skip remains, and none should.

  The rename is global in form but singular in effect: `load_rb` is the only
  name in the entire vendored corpus (Rails, i18n, rack, globalid,
  did_you_mean) with a standalone `rb` token, against 8 for `erb`.

- **Converged signal:** `pnpm parity:api` shows `backend/simple.rb 28/28` with
  `load_rb` matched to `loadJs` (i18n 183/184 overall), and `pnpm parity:test`
  shows `backend/simple_test.rb 30/31`.

The one piece #6017 left undone — and all that PR #6043 carries — is that its
`rb: "js"` table entry was never reachable: `applyTokenRenames`' regex matched
only `erb|ERB|Erb`, so the entry was dead code and `load_rb` kept resolving to
`loadRb`. #6043 widens the alternation to make the documented rename real.
