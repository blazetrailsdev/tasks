---
title: "i18n-backend-chain"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6031
claim: "2026-08-03T22:14:13Z"
assignee: "i18n-backend-chain"
blocked-by: null
closed-reason: null
---

# Port `I18n::Backend::Chain` and the Fallbacks-over-Chain cases

## Context

- `vendor/i18n/lib/i18n/backend/chain.rb` is unported; `packages/i18n/src/backend`
  has `base`, `simple`, `transliterator` and (as of the `i18n-backend-fallbacks`
  PR) `fallbacks`.
- `vendor/i18n/test/backend/fallbacks_test.rb:303-348` is the
  `I18nBackendFallbacksWithChainTest` group — six cases that mix
  `I18n::Backend::Fallbacks` into `I18n::Backend::Chain` and assert `translate`
  and `exists?` fall through both the chain and the locale chain. They are the
  8-test gap `pnpm parity:test` reports on
  `backend/fallbacks_test.rb -> backend/fallbacks.test.ts` (the other two are
  the `Thread.new` cases, which JS has no analogue for — see the header note in
  `packages/i18n/src/backend/fallbacks.test.ts`).
- The mixin factory is already in place: `Fallbacks(Simple)` in
  `packages/i18n/src/backend/fallbacks.ts`, so `Fallbacks(Chain)` is the shape
  these cases need.

## Acceptance criteria

- `i18n/lib/i18n/backend/chain.rb` is ported to
  `packages/i18n/src/backend/chain.ts`, with `i18n/test/backend/chain_test.rb`
  ported alongside (test names verbatim).
- The `I18nBackendFallbacksWithChainTest` group is added to
  `packages/i18n/src/backend/fallbacks.test.ts` and the "Not ported" note in
  that file's header is narrowed to the two thread cases.
