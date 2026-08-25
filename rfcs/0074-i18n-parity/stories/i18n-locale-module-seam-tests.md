---
title: "Cover the locale-module registry seam with trails-only tests"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6088
claim: "2026-08-04T20:08:08Z"
assignee: "i18n-date-complete-frags-commercial-entry"
blocked-by: null
closed-reason: null
---

## Context

The locale-module seam — `registerLocaleModule` / `preloadTranslationFiles` /
`loadJs` in `packages/i18n/src/backend/base.ts:57-140` — stands in for the gem's
`load_rb` (`vendor/i18n/lib/i18n/backend/base.rb:254-256`, dispatched by
`load_file`'s extension arms at `:240-247`). It is the only file-loading arm in
the package with **no direct test**.

What exists today on `main`:

- `packages/i18n/src/backend/simple.test.ts:38,139,149` exercises it _indirectly_
  via the two ported Rails cases (`load_translations: given a Ruby file name it
does not raise anything`, `load_rb: loads data from a Ruby file`). Those are
  Rails-parity tests and must not be extended with trails-only assertions —
  see [[feedback_ts_only_extras_go_in_trails_test_file]].
- `packages/i18n/src/backend/base.file-loading.trails.test.ts` is the trails-only
  home for exactly this kind of seam coverage — it already covers the
  `registerFileReader` reader seam and the preload/lazy-init guards — but has
  **no** locale-module tests at all.

The gap is a history artifact, not a decision. PR #6043 originally carried four
such tests; #6017 landed the feature first with a different API shape
(`registerLocaleModule` singular, `.js`-only dispatch), so #6043 was rebased down
to a one-line api-compare fix and the tests were dropped rather than rewritten
against the merged shape. A prior review round on #6043 had specifically called
for a bundled-host test proving registration is used so `import()` is never
reached; that requirement survived the feature but lost its carrier.

## Acceptance criteria

Add to `packages/i18n/src/backend/base.file-loading.trails.test.ts` (trails-only
file, no Rails counterpart — do not touch `simple.test.ts`), written against the
merged `registerLocaleModule(filename, translations)` singular API and `.js`
dispatch:

- **Registered module is used without `import()`.** Register a module under a
  bundler-style path that could not resolve on disk (e.g. `bundled/en.js`), drive
  it through `preloadTranslationFiles()`, and assert the translation resolves.
  Pair it with an _unregistered_ `bundled/unregistered.js` case that would reject
  if dynamic `import()` were reached — that contrast is what actually proves the
  registry short-circuits the import, and is what the earlier review asked for.
- **Non-hash default export raises `InvalidLocaleData`**, matching the
  post-dispatch check `load_rb` results are subject to at
  `vendor/i18n/lib/i18n/backend/base.rb:240-252`.
- **Neither registered nor preloaded** raises the directed "await
  `I18n.preloadTranslationFiles()`" error from
  `packages/i18n/src/backend/base.ts:135-138`, not a bare `UnknownFileType`.
- **Development path**: a module named only in `I18n.load_path` and resolved by
  an awaited `preloadTranslationFiles()` loads via real `import()`, using the
  on-disk `packages/i18n/src/test-data/locales/en.ts` fixture under its emitted
  `en.js` name.

Guard rails:

- No new public TS surface — `pnpm parity:api:extra --package i18n` must not gain novel
  names. This is tests only.
- Reset registry state between tests so a registered `bundled/*` entry cannot
  leak into a sibling test (the file's existing `beforeEach` resets config and
  the backend; check whether the module registry needs the same and add it if
  not — a leaking registry is the shape behind
  [[project_preloadertest_taggings_registry_leak]]).
- `pnpm parity:test` must not move: these are trails-only tests in a
  trails-only file and must not be picked up as Rails-matched.

## Out of scope

Adding `.ts` / `.mjs` dispatch arms. `load_rb` has exactly one Ruby counterpart,
so one ported arm (`loadJs`) is the faithful mapping; extra arms would be extra
surface with no Ruby name behind them, and a TS locale module is registered under
its emitted `.js` name anyway. See the amended acceptance in
`i18n-backend-load-rb-decision`.
