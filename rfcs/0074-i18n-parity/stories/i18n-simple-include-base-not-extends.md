---
title: "Backend::Simple includes Base in the gem, extends it in trails"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6054
claim: "2026-08-04T12:38:44Z"
assignee: "i18n-simple-include-base-not-extends"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api` reports i18n `inheritance: 5/6 (83.3%)`, with one mismatch:

```json
{
  "rubyFqn": "I18n::Backend::Simple",
  "rubyFile": "backend/simple.rb",
  "tsFile": "backend/simple.ts",
  "tsName": "Simple",
  "rubySuper": null,
  "tsSuper": "Base",
  "tsChain": ["Base"],
  "reason": "super-mismatch"
}
```

In the gem, `Simple` has **no** superclass — it is
`class Simple; module Implementation; include Base` …
`include Implementation` (`vendor/i18n/lib/i18n/backend/simple.rb:20-23`).
`packages/i18n/src/backend/simple.ts:33` ports that as
`export class Simple extends Base`.

This matters beyond the score: the gem's `Implementation` module is the
documented extension seam (`simple.rb:10-19` shows
`I18n::Backend::Simple.include(I18n::Backend::Pluralization)` overriding
`pluralize` and calling `super`), and the deferred-backend mixins
(`Pluralization`, `Memoize`, `Cascade`, `Fallbacks`) all rely on being inserted
_between_ `Simple` and `Base`. `extends Base` collapses that seam. CLAUDE.md's
settled idiom for `include` is `include()` / `Included<>` from
`@blazetrails/activesupport`, or the class-factory shape already used by
`packages/i18n/src/backend/fallbacks.ts` for the `super`-calling case.

## Acceptance criteria

- Either `Simple` is reshaped so `Base` is mixed in rather than extended (the
  gem's `Implementation` seam preserved, so a mixin can sit between `Simple`
  and `Base` and call `super`), or — if a genuine TS shortcoming blocks it —
  the deviation is recorded at the call site per CLAUDE.md with the specific
  language limitation, not in the PR body.
- Whichever path: `pnpm parity:api` i18n inheritance is 6/6 or the exclusion
  is registered with a reviewed reason.
- `backend/simple.test.ts` and `backend/fallbacks.test.ts` still pass —
  `Fallbacks(Simple)` must keep working.
