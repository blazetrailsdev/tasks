---
title: "Port i18n's 16 remaining tests (RFC 0074 is closed; they are unowned)"
status: draft
updated: 2026-08-13
rfc: "0000-ar-deps-test-parity-100"
cluster: name-gap
packages:
  - "i18n"
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

i18n sits at 291/307 (94.8%), 16 remaining, all genuinely missing (0 skipped).
RFC 0074 `i18n-parity` is **closed**, so nothing owns them.

Measured 2026-08-13 with `pnpm parity:test -- --cached`, against
`vendor/rails/i18n/test/`:

- `i18n/load_path_test.rb` — 6 missing (our `packages/i18n/src/load-path.test.ts`
  has none of them; the compare maps `test/i18n/<x>_test.rb` →
  `packages/i18n/src/<x>` by dropping the leading segment,
  `scripts/test-compare/compare.ts` path mapping)
- `api/override_test.rb` — 2, `api/chain_test.rb` — 1,
  `api/fallbacks_test.rb` — 1, `api/key_value_test.rb` — 1 (the `api/*` files are
  thin drivers that mix in `I18n::Tests::…` modules)
- `backend/fallbacks_test.rb` — 2, `i18n/interpolate_test.rb` — 2,
  `locale/tag/simple_test.rb` — 1

The `api/*` drivers are the interesting shape: in Ruby each is a class that
`include`s several shared `I18n::Tests::*` modules and the test names come from
the modules. Check how the already-passing `api/simple_test.rb` (1/1) is wired
in `packages/i18n/src/api/simple.test.ts` and follow it rather than inventing a
second arrangement.

## Acceptance criteria

- All 16 tests exist with Rails names verbatim and pass; i18n reads 100% with
  `skipped = 0` in `pnpm parity:test`.
- The `api/*` drivers reuse the existing shared-module arrangement.
- Any i18n implementation gap the ports uncover is fixed in
  `packages/i18n/src/` (not stubbed) or filed as its own story if it exceeds this
  PR's scope.
