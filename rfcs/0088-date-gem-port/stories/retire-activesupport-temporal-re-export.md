---
title: "retire-activesupport-temporal-re-export"
status: done
updated: 2026-08-06
rfc: "0088-date-gem-port"
cluster: null
deps: ["route-temporal-imports-activemodel-arel", "route-temporal-imports-activerecord"]
deps-rfc: []
est-loc: 100
pr: 6154
claim: "2026-08-06T13:40:06Z"
assignee: "activemodel-type-time-returns-a-time"
blocked-by: null
closed-reason: null
---

## Context

Closes the "Temporal comes from `packages/date`" flip.

Once activemodel, arel and activerecord import `Temporal` from
`@blazetrails/date`, the re-export shim at
`packages/activesupport/src/temporal.ts` has only activesupport's own 21 files
and actionpack's 4 left. ActiveSupport should consume the substrate like any
other package rather than appearing to own it — in Rails, ActiveSupport
`require`s `date`, it does not vend it.

`temporal.ts` also holds `instantFrom(date: Date)` (`temporal.ts:5-8`), a JS-`Date`
bridge. That **stays in activesupport**: `packages/date` has no opinion about JS
`Date`, and the function has no counterpart in the gem.

**actionpack is deliberately not converged** (RFC 0023 owns its HTTP-header date
handling). If it still imports the shim, the shim stays as a one-line re-export
for it — say so explicitly rather than leaving it looking vestigial.

## Acceptance criteria

- [ ] `packages/activesupport`'s own `Temporal` imports come from
      `@blazetrails/date`.
- [ ] `@js-temporal/polyfill` appears in exactly one `package.json` —
      `packages/date`. Verify with a repo-wide grep, and verify pnpm resolves one
      instance (`readlink -f` on the store path).
- [ ] `instantFrom` stays in activesupport.
- [ ] `activesupport/src/temporal.ts` either deleted, or reduced to a documented
      re-export for actionpack with the reason stated in the file.
- [ ] `pnpm typecheck` green; full suite green on all three adapter lanes.
