---
title: "Make the whole reload chain async, not just the I18n.reload! seam"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 6086
claim: "2026-08-04T19:56:49Z"
assignee: "i18n-async-reload-chain"
blocked-by: null
closed-reason: null
---

## Context

PR #6030 made only the outermost seam async: `I18n.reloadBang()`
(`vendor/i18n/lib/i18n.rb:84-87`) awaits a re-read of `I18n.load_path` and then
calls the still-synchronous `config().backend.reloadBang()`. The read therefore
lives above the backend rather than inside the reload chain that actually
reaches `load_translations`.

The requested shape is that every reload seam does the same async init the boot
preload does, so the read sits where the gem reads:

- `Backend::Base#reload!` (`vendor/i18n/lib/i18n/backend/base.rb:101-103`) awaits
  the re-read, then keeps `eager_load! if eager_loaded?` verbatim — so both the
  lazy arm and the eager arm see fresh bytes with one read per reload.
- `Backend::Base#eager_load!` (`base.rb:105-107`) and `Simple#reload!` /
  `Simple#eager_load!` (`vendor/i18n/lib/i18n/backend/simple.rb:57-67`) become
  async, awaiting `super` and keeping their statements in gem order.
- `I18n.eager_load!` (`i18n.rb:92-94`) awaits the same re-read, so an eager load
  is self-sufficient rather than depending on a prior preload.
- `Config#load_path=` (`vendor/i18n/lib/i18n/config.rb:132-136`) calls
  `backend.reload!`, which is now async. A TS `set` accessor cannot be awaited,
  so it converges to the settled `setLoadPath()` idiom, with `I18n.setLoadPath`
  (`i18n.rb:69`) awaiting it.

The read stays the one helper `reloadTranslationFiles()` added by #6030 (clear
`fileContents`, re-run `preloadTranslationFiles()`); boot still awaits
`preloadTranslationFiles()` once. The four lazy `init_translations` call sites in
`simple.ts` and every other ported body stay synchronous and verbatim — this is
deliberately NOT the rejected "make lookup/translate/availableLocales async"
option measured on #6021.

A working draft of this reached green typecheck with two test failures left,
both in tests that call the now-async methods without awaiting:

- `simple.test.ts` "simple reload!: reinitialize the backend if it was
  previously eager loaded" — `backend.eagerLoadBang()` / `backend.reloadBang()`
  need awaiting (the `it` becomes async).
- `base.file-loading.trails.test.ts` "refuses a lazy lookup while I18n.load_path
  is unread" — `await config().setLoadPath(...)` now reloads the backend, which
  re-runs the preload and throws on the never-preloaded file at assignment time
  rather than at lookup; the test needs re-aiming at the seam it is actually
  pinning, or the no-reader/missing-file arm reconsidered.

Test names are Rails-verbatim and must not be reworded — only the callbacks
become async.

## Acceptance criteria

- `Backend::Base#reloadBang` / `#eagerLoadBang` and `Simple#reloadBang` /
  `#eagerLoadBang` are async, with gem statement order preserved.
- Exactly one re-read per reload, including the eager-loaded arm.
- `Config#loadPath=` converges to an async `setLoadPath()`; `I18n.setLoadPath`
  awaits it; every assignment call site updated.
- `I18n.eagerLoadBang()` re-reads without a caller-run preload.
- The four lazy `initTranslations` call sites in `simple.ts` stay synchronous.
- No Rails test name reworded.
