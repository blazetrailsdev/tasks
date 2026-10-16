---
title: "Drop Kernel#send from RUBY_COMPAT_EXPORTS so the reverse reading can never demand rbFSend"
status: draft
updated: 2026-10-16
rfc: "0000-ruby-compat-native-first"
cluster: gate
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`send` / `public_send` are not scored call names (`scripts/api-compare/compare.ts:419-428`).
Their faithful port is a computed member access. But
`RUBY_COMPAT_EXPORTS` maps `Kernel#send` to `rbFSend`
(`scripts/parity/ruby-compat.ts:66`), and `lint-ruby-compat-calls.ts` reads
that table in reverse to flag a hand-rolled primitive. The row is latent
today, and it would start demanding `rbFSend` if `send` were ever scored.

## Acceptance criteria

- [ ] The row is removed, or moved to a forward-credit-only list with a comment citing `compare.ts:419-428`.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:ruby-compat` (`scripts/api-compare/lint-ruby-compat-calls.ts`) stay green.
