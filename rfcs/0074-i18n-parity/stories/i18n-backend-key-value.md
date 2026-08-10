---
title: "Port I18n::Backend::KeyValue and the chain tests it gates"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: 6041
claim: "2026-08-04T16:49:07Z"
assignee: "i18n-backend-key-value"
blocked-by: null
closed-reason: null
---

# Port `I18n::Backend::KeyValue` and the chain tests it gates

## Context

- `vendor/i18n/lib/i18n/backend/key_value.rb` is unported. It is the last
  backend in the gem besides `Chain` (ported in PR #6031), `Simple`,
  `Fallbacks` and `Transliterator`.
- Its absence is measurable: `vendor/i18n/test/backend/chain_test.rb:139-175`
  is `I18nBackendChainWithKeyValueTest`, four cases the gem guards with
  `if I18n::TestCase.key_value?`, and they are the only gap `pnpm parity:test`
  reports on `backend/chain_test.rb -> backend/chain.test.ts` (17/21).
- The two `subtrees` arms those cases exercise (`setup_backend!(true)` and
  `(false)`) are what `Base#subtrees` in `packages/i18n/src/backend/base.ts`
  exists for — nothing currently overrides it to `false`, so that branch of
  `Base#translate` is untested.

## Acceptance criteria

- `i18n/lib/i18n/backend/key_value.rb` is ported to
  `packages/i18n/src/backend/key-value.ts`, with the store abstracted the way
  the gem abstracts it (it takes any store answering `[]` / `[]=`).
- `i18n/test/backend/key_value_test.rb` is ported alongside, names verbatim.
- `I18nBackendChainWithKeyValueTest` is added to
  `packages/i18n/src/backend/chain.test.ts`, closing the 17/21 gap there, and
  the "Not ported" note in that file's header is removed.
