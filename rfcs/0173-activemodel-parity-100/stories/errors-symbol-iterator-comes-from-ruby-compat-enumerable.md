---
title: "activemodel: Errors' [Symbol.iterator] is derived by ruby-compat's Enumerable from each"
status: ready
updated: 2026-10-02
rfc: "0173-activemodel-parity-100"
cluster: receipts
packages: ["activemodel", "ruby-compat"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in review of trails#8321 (`activemodel-audit-permanent-receipts-root`).
`ActiveModel::Errors` is `include Enumerable` with `each` delegated to `@errors`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/errors.rb:62,103`). trails ports both halves —
`Errors#each` and `include(Errors, Enumerable)` (`packages/activemodel/src/errors.ts`) — and then adds
a hand-written `[Symbol.iterator]()` on the class so `for...of`, spread and `Array.from` work.

That member has no Ruby counterpart on `Errors`, and no CLAUDE.md section ratifies it: § "Module
mixins" covers `include()`, not a member an includer writes for itself. ruby-compat's `Enumerable`
(`packages/ruby-compat/src/enumerable.ts`) derives every member it ports from the includer's `each`
(`rbBlockCall`), exactly as `vendor/ruby/v3.3.11/enum.c` does. `[Symbol.iterator]` is the JS spelling of
what Ruby's `for x in enum` / `*enum` / `to_a` get from that same `each`, so it belongs on the mixin,
derived once, not re-written per includer. `scripts/api-compare/stdlib-mixin-surface.ts` already
treats `[Symbol.iterator]` as the member that answers Enumerable's contract.

The same hand-written member is receipted `PERMANENT` on activerecord's Enumerable includers
(`result.ts`, `associations/collection-proxy.ts`, `associations/join-dependency.ts`,
`associations/join-dependency/join-part.ts`).

## Acceptance criteria

- [ ] ruby-compat's `Enumerable` carries `[Symbol.iterator]`, derived from the includer's `each`, with its MRI receipt.
- [ ] `Errors` drops its own `[Symbol.iterator]` and its receipt; `for...of`, spread and `Array.from` over an `Errors` still pass in `packages/activemodel/src/errors.trails.test.ts`.
- [ ] `pnpm parity:api:extra:gate` green (ruby-compat's addition is receipted, so its mark does not move).

## Verification

```bash
pnpm parity:api:extra:gate && pnpm parity:api:extra --package activemodel && pnpm vitest run packages/activemodel/src/errors.trails.test.ts packages/ruby-compat/src/enumerable.test.ts
```
