---
title: "Call-arg block padding resolves the callee by receiver, not by same-package name"
status: draft
updated: 2026-10-18
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`stripBlockTailPadding` (`scripts/api-compare/call-args.ts`, RFC 0099) drops the `nil` / `undefined` a TS call writes to reach a trailing block, but only when `padsDefaultedParams` finds a same-package signature, by call name, that defaults the padded positions. In actionview, `this.debug(undefined, () => …)` in `LogSubscriber#renderPartial` / `#renderCollection` and `this.logger()!.debug(undefined, () => …)` in `Start#start` (`packages/actionview/src/log-subscriber.ts`) mirror `debug do … end` (`vendor/rails/v8.0.2/actionview/lib/action_view/log_subscriber.rb`). The callee is `ActiveSupport::LogSubscriber#debug(progname = nil, &block)` (`vendor/rails/v8.0.2/activesupport/lib/active_support/log_subscriber.rb:160-167`), or `Logger#debug`, both in activesupport. The comparer finds only actionview's homonym `DebugHelper#debug(object)`, whose parameter is required, so the padding scores as a `shape` row. The `info` sites in the same file are not flagged. trails#9016 receipted the three declarations with `@missingRailsArgs debug — PERMANENT` to clear the gate.

## Acceptance criteria

- The padding check resolves the callee through the receiver's class chain, including ancestors in other packages, or considers signatures from the package that defines the receiver's superclass, rather than any same-package function of the same name.
- With that change the three actionview rows no longer appear, and their `@missingRailsArgs debug` receipts are removed, which the stale-receipt check enforces.
- A unit test in `scripts/api-compare/call-args.test.ts` pins a same-name homonym with a required parameter not blocking the strip.
