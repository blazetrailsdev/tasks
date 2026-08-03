---
title: "Converge Simple's lazy init onto the gem's load-then-initialize order"
status: blocked
updated: 2026-08-03
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-08-03T18:22:42Z"
assignee: "i18n-backend-async-read-path"
blocked-by: "Depends on unmerged PR #5995 (feat(i18n): port Backend::Base translation-file loading, still OPEN). The entire premise — Base#loadTranslations, Simple#initTranslations awaiting the load, and the markInitialized guard this story must remove — exists only on that branch; origin/main's packages/i18n/src/backend/simple.ts has initTranslations as a bare flag flip and no file-loading lane at all. Converging here would require stacking on #5995, which the repo forbids. Unblock once #5995 merges."
closed-reason: null
---

## Context

`packages/i18n/src/backend/simple.ts` deviates from the gem at the four
synchronous lazy-init call sites. Rails calls `init_translations` from
`lookup`, `available_locales`, `translations(do_init:)` and `eager_load!`, and
`init_translations` calls `load_translations` before setting
`@initialized = true` (`vendor/i18n/lib/i18n/backend/simple.rb:49-55`,
`:64-85`, `:93-95`).

trails cannot do that today: `packages/i18n` imports nothing from `node:*` and
reads files asynchronously, so `load_translations` returns a Promise and cannot
be awaited from a synchronous method. PR #5995 shipped `initTranslations` with
the gem's body (await the load, then mark initialized) plus a guard in
`markInitialized` that raises when `I18n.load_path` is populated but unread,
rather than silently resolving translations against an empty store. With an
empty `load_path` the behaviour is byte-identical to the gem.

This was raised twice in review on #5995 and is registered here as debt.

## Acceptance criteria

- The four lazy-init sites call `initTranslations`, and `initTranslations`
  loads `I18n.load_path` before marking the backend initialized — the gem's
  order, at the gem's call sites.
- `markInitialized` and its raise are gone.
- The knock-on async conversion of `lookup` / `translate` / `availableLocales`
  is carried through `packages/activemodel` and `packages/activerecord`
  callers, or an alternative is found that keeps those synchronous without a
  blocking read.

## Notes

The cheap alternative — letting the host register a _synchronous_ reader, so
every Rails call site ports verbatim — was considered and rejected when #5995
was scoped, because it rules out non-blocking and browser hosts. Reopening that
trade-off is in scope for this story if the async conversion proves too broad.
