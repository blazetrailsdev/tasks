---
title: "Converge the last JS-symbol Ruby Symbol arms — main does not typecheck"
status: closed
updated: 2026-08-03
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 0
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Duplicate of converge-symbol-call-sites-after-colon-string-flip, which names the same nine call sites and the same red build on main."
---

## Context

`main` (b548cd2ee) does not typecheck. `pnpm build` fails with 10 errors, all
from the JS-`symbol` spelling of Ruby Symbol values that
`i18n-symbol-values-are-colon-strings` (PR #6032) removed from
`backend/base.ts` / `backend/simple.ts` — but `backend/fallbacks.ts` (PR #6029)
landed alongside it still on the old spelling, and three shim call sites were
never converted:

```text
packages/i18n/src/backend/fallbacks.ts(109,40): error TS2345: Argument of type
  'symbol | TranslationKey | null | undefined' is not assignable to parameter of
  type 'TranslationKey | null | undefined'.
  (also 111,78 · 124,54 · 159,20 · 203,37 · 207,38)
packages/activemodel/src/naming.ts(345,38): error TS2345: Argument of type 'symbol'
  is not assignable to parameter of type 'TranslateKey | TranslateKey[] | undefined'.
packages/activemodel/src/validations.ts(202,28): same
packages/activerecord/src/validations.ts(60,9): same
```

Sites:

- `packages/i18n/src/backend/fallbacks.ts:105,150,158,184-190,199,221` —
  `symbol` in the signatures plus the `typeof subject === "symbol"` and
  `typeof default_ !== "symbol"` arms, mirroring
  `vendor/i18n/lib/i18n/backend/fallbacks.rb:65-116`.
- `packages/activemodel/src/naming.ts:342-345` — `Symbol.for(k)` default chain
  and `I18n.translate(Symbol.for(key))`.
- `packages/activemodel/src/validations.ts:202-204` —
  `I18n.t(Symbol.for(...))`, `default: Symbol.for("errors.messages.model_invalid")`.
- `packages/activerecord/src/validations.ts:60` — same shape.

The comment at `fallbacks.ts:184-186` names this story's predecessor as the
convergence owner, so the deviation is known and unconverged. CLAUDE.md: a Ruby
Symbol value is a colon-prefixed JS string (`":name"`), never `Symbol.for`.

Blocks measurement as well as CI: `pnpm parity:api` refuses to run against an
`OutOfDateBuildInfoWithErrors` build for activemodel / activerecord / i18n.

## Acceptance criteria

- No `Symbol.for` / `typeof x === "symbol"` Ruby-Symbol-value arm remains in
  `packages/i18n/src`, `packages/activemodel/src`, `packages/activerecord/src`;
  all use the `":name"` string spelling and `.slice(1)` for the name.
- `pnpm build` and `pnpm typecheck` pass on the resulting tree.
- The stale comment at `fallbacks.ts:184-186` is deleted with the code it
  describes.
- `backend/fallbacks.test.ts` and the AM/AR validation tests still pass with
  the colon spelling (a `":other.key"` default resolves, a plain string does not).
