---
title: "call-args: nil padding resolves a callee signature declared in a dependency package (Redirect#call's instrument)"
status: done
updated: 2026-10-13
rfc: "0163-actiondispatch-routing-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8873
claim: "2026-10-13T20:42:25Z"
assignee: "activerecord-test-config-rb-constants-converge"
blocked-by: null
closed-reason: null
---

## Context

`Redirect#call` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/redirection.rb:22-33`)
is `ActiveSupport::Notifications.instrument("redirect.action_dispatch") do |payload|`.
The port in `packages/actionpack/src/action-dispatch/routing/redirection.ts`
passes what Rails passes: the name, `undefined` for the skipped `payload`
positional, and the block taking `payload`.

`pnpm parity:api:calls:args` still flags it as
`instrument(str:redirect.action_dispatch)` against `[str, nil]`.
`stripBlockTailPadding` in `scripts/api-compare/call-args.ts` drops the `nil`
only when `padsDefaultedParams` finds a callee signature that defaults the
padded parameter, and `portedWithArgsSigs` in `scripts/api-compare/compare.ts`
is built from the calling package's own declarations (`recordTsParams` records
`portedWithArgsMaps` only under `scope === "package"`). `Notifications.instrument`
is declared in activesupport and called from actiondispatch, so the signature
is never found.

The call carries `@missingRailsArgs instrument — CONVERGEABLE` naming this
story, on `Redirect#call`.

## Acceptance criteria

- [ ] The block-tail and kwargs-lead padding rules resolve a callee declared in
      a dependency package, with a case in `scripts/api-compare/call-args.test.ts`.
- [ ] The `@missingRailsArgs instrument` receipt on `Redirect#call` is deleted
      and `pnpm parity:api:calls:args` is green without it.
- [ ] Any baseline row the wider lookup converges is deleted by hand and its
      mark tightened; no reseed.
