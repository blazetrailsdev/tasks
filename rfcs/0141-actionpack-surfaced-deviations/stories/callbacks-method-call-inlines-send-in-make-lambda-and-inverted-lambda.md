---
title: "Callbacks MethodCall extracts a private send helper Rails inlines, so its property arm cannot be receipted"
status: draft
updated: 2026-10-05
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Callbacks::CallTemplate::MethodCall`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/callbacks.rb:337-372`) has
no `send` helper: `make_lambda` (`:359-363`) and `inverted_lambda` (`:365-369`)
each inline `target.send(@method_name, &block)`.

trails' `MethodCall` (`packages/activesupport/src/callbacks.ts:92-121`) extracts
that into a `private send(target, block)` both lambdas call. trails#8518 added a
property arm there (`if (this.methodName in target) return method;`) so a
condition naming an accessor property dispatches, per CLAUDE.md § "Generated
attribute readers are properties".

Because `send` has no Rails pair, the arm cannot carry its receipt:
`lint-arm-throws` reds `@inventedArm if — PERMANENT` on it as STALE with
"declaration not compared" (CI run 37253242052 on trails#8518).

## Acceptance criteria

- `MethodCall` has no `send` member; `makeLambda` and `invertedLambda` each hold
  the dispatch, as `callbacks.rb:359-369` does. `ObjectCall` (`:374-402`) is
  checked for the same extraction.
- The property arm sits on declarations that are compared, and carries
  `@inventedArm if — PERMANENT` on each, with `pnpm parity:api:arms:throws`
  green on a freshly regenerated artifact (`API_COMPARE_FORCE=1 pnpm parity:api --calls` first).
- `callbacks.trails.test.ts` "sends a condition naming an accessor property" and
  "raises NoMethodError when the target does not answer the method" stay green.
