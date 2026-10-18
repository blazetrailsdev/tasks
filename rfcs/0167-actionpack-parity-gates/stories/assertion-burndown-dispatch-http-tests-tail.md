---
title: "assertion-burndown-dispatch-http-tests-tail"
status: draft
updated: 2026-10-18
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# assertion-burndown-dispatch-http-tests-tail

## Context

Remainder of `assertion-burndown-dispatch-http-tests-remainder`, whose PR ported
`ContentSecurityPolicyTest` (`vendor/rails/v8.0.2/actionpack/test/dispatch/content_security_policy_test.rb:1-326`)
to Rails' bodies and ran out of LOC. `session/cookie_store_test.rb` was split out to
`assertion-burndown-dispatch-cookie-store-test`. Still open, measured with
`pnpm parity:test --assertions --missing --package actiondispatch` on 2026-10-18:

- **CSP integration classes** (`content_security_policy_test.rb:328-760`) →
  `packages/actionpack/src/action-dispatch/dispatch/content-security-policy.test.ts`.
  The ports skip `ContentSecurityPolicy::Middleware` and read the header through a
  `resolvedCspHeader` helper. A conversion was written and passes against the real
  stack: per class, a `PolicyController` registered under the Rails module path,
  `ROUTES` with `scope({ module: … })`, `IntegrationTest.buildApp(ROUTES, (m) => { m.use(Lint); m.use(PolicyConfigMiddleware); m.use(Middleware); m.use(Lint); })`
  (the shape `HelpersContentSecurityPolicyIntegrationTest` already uses), `t.get`,
  and a same-file `assertPolicy` mirroring Rails' `assert_policy` (`:440`, `:631`).
  Conditions are `if: ":isCondition"`. It brings the file to 0 rows only together
  with a symmetric fold of `assert_policy` (see `assertion-kinds-fold-actionpack-private-assert-helpers`):
  a shared `scripts/test-compare/folded-assert-helpers.json` name list read by
  `extract-ruby-tests.rb` (`assertion_method?` sites in `count_assertions_expanded`
  and `collect_assertion_kinds_expanded`) and by `extract-ts-core.ts`
  (`isAssertionCallee` sites in `countAssertions` / `collectAssertionKinds`),
  folding a listed name only when it resolves to a same-file helper. That pair
  measured actiondispatch count 105→87, kind 160→132 with no other package moving.
- **`response_test.rb`**: "can wait until commit" / "stream close" (`:13-25`),
  "each isnt called if str body is written" (`:42-60`), "message" (`:214-224`),
  "read ETag and Cache-Control" / "read strong ETag" (`:253-283`).

## Acceptance criteria

- The two files' real divergences are converged by porting the Rails bodies.
- `pnpm parity:test --assertions` shows no divergence rows for them, and the
  actiondispatch mark is lowered with `pnpm parity:test:assertions:reseed`.
