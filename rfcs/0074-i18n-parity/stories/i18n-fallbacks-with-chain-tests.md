---
title: "i18n-fallbacks-with-chain-tests"
status: blocked
updated: 2026-08-03
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-08-03T22:32:08Z"
assignee: "i18n-fallbacks-with-chain-tests"
blocked-by: "Blocked on two unmerged PRs. The story adds the I18nBackendFallbacksWithChainTest group (vendor/i18n/test/backend/fallbacks_test.rb:303-348) to packages/i18n/src/backend/fallbacks.test.ts, using Fallbacks(Chain). On origin/main neither packages/i18n/src/backend/fallbacks.ts nor chain.ts exists: fallbacks.ts (and fallbacks.test.ts itself, whose header note this story narrows) lands in PR #6029, still OPEN; chain.ts lands in PR #6031, still OPEN. Every acceptance criterion targets files introduced by those PRs, so the work cannot be done from main without stacking, which CLAUDE.md forbids. Unblock once BOTH #6029 and #6031 are merged."
closed-reason: null
---

# Add the `I18nBackendFallbacksWithChainTest` group to `fallbacks.test.ts`

## Context

- `packages/i18n/src/backend/chain.ts` landed with the `i18n-backend-chain`
  story (PR pending), porting `i18n/lib/i18n/backend/chain.rb` and
  `i18n/test/backend/chain_test.rb`.
- The second half of that story — the six
  `I18nBackendFallbacksWithChainTest` cases at
  `vendor/i18n/test/backend/fallbacks_test.rb:303-348`, which mix
  `I18n::Backend::Fallbacks` into `I18n::Backend::Chain` and assert
  `translate` / `exists?` fall through both the chain and the locale chain —
  could not ship in the same PR: `packages/i18n/src/backend/fallbacks.ts` is
  still unmerged (PR #6029, draft at the time of writing), and this repo does
  not stack PRs.
- Once #6029 is merged, `Fallbacks(Chain)` is the shape those cases need — the
  mixin factory is already `Fallbacks(Simple)` in that PR.

## Acceptance criteria

- The `I18nBackendFallbacksWithChainTest` group is added to
  `packages/i18n/src/backend/fallbacks.test.ts`, test names verbatim from
  `vendor/i18n/test/backend/fallbacks_test.rb:303-348`.
- The "Not ported" note in that file's header is narrowed to the two
  `Thread.new` cases (JS has no analogue).
- `pnpm test:compare` gap on `backend/fallbacks_test.rb ->
backend/fallbacks.test.ts` drops to the two thread cases.
