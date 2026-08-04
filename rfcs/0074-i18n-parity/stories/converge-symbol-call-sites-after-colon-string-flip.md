---
title: "converge-symbol-call-sites-after-colon-string-flip"
status: closed
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "superseded by i18n-fallbacks-symbol-arms-break-typecheck (closed), which landed the central fix; all nine call sites now pass colon-prefixed strings and pnpm build is green on main"
---

## Context

`b548cd2ee` (PR #6032, "spell Ruby Symbol values as colon-prefixed strings")
narrowed `TranslationKey` / `TranslateKey` in `packages/i18n/src/i18n.ts` to
exclude JS `symbol`, but left nine call sites still passing a JS `Symbol`.
`pnpm build` (`tsc --build`) fails on `origin/main` with no local changes, so
every branch cut from main inherits a red `Build & Type Check` and `Unit Tests`
(observed on PR #6027, run 30862015930).

Failing call sites:

- `packages/i18n/src/backend/fallbacks.ts:109,111,124,159,203,207`
- `packages/activemodel/src/naming.ts:345`
- `packages/activemodel/src/validations.ts:202`
- `packages/activerecord/src/validations.ts:60`

Per CLAUDE.md and RFC 0082, a Ruby Symbol value is a colon-prefixed JS string
(`":short"`), never a JS `Symbol` — so these call sites converge onto the
string spelling rather than the types widening back to accept `symbol`.

## Acceptance criteria

- `pnpm build` and `pnpm typecheck` are clean on `main`.
- Each of the nine call sites passes a colon-prefixed string, matching the
  Ruby Symbol at its Rails counterpart; `TranslationKey` / `TranslateKey` are
  not widened to re-admit `symbol`.
- The i18n suite is no worse than the current baseline (11 pre-existing
  fallbacks/exceptions failures, which are the same Symbol-spelling fallout and
  should also be checked against this change).
