---
title: "backend/chain.rb is ported but still deferred whole-file"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6071
claim: "2026-08-04T16:34:06Z"
assignee: "i18n-defer-backend-chain-stale"
blocked-by: null
closed-reason: null
---

## Context

`backend/chain.rb` is still deferred whole-file in
`scripts/api-compare/unported-files.ts` ("Pre-1.0: optional backend mixin —
composes several backends behind one lookup"), but it IS ported:
`packages/i18n/src/backend/chain.ts` (183 lines) mirrors
`vendor/i18n/lib/i18n/backend/chain.rb` method for method, and
`packages/i18n/src/backend/chain.test.ts` ports its suite.

So nothing in `Chain` is measured — the same stale-deferral bug PR #6063 just
fixed for `backend/key_value.rb` and `backend/flatten.rb`, which moved i18n
from `130/136 methods | files 13/13` to `177/184 | files 15/15`.

## Converged shape

Delete the `backend/chain.rb` entry from `unported-files.ts`, add
`backend/chain.rb` to the `inScope` set in the "accounts for every file in the
vendored i18n lib tree" test (`unported-files.test.ts`), then close whatever
gaps the newly-measured file reports — port them, or, if a Ruby-only construct
turns up like `I18n::JSON` did in key_value.rb, enter it in the
`RUBY_ONLY_CLASSES` register PR #6063 added to `scripts/api-compare/conventions.ts`
(consulted by both the method comparison and the inheritance check).

Watch for the `Chain::Implementation` module: `chain.rb:15` splits the code the
same way `key_value.rb:69` does, and `chain.ts`'s header documents collapsing it
into one class extending `Base`.

## Acceptance criteria

- `backend/chain.rb` no longer appears in `unported-files.ts`.
- i18n `parity:api` matched-method and matched-file counts do not regress from
  `177/184` and `15/15`; the file count goes to 16.
- Every gap the newly-measured file reports is ported or carries a reviewed
  justification at the call site.
- `unported-files.test.ts` stays green.
