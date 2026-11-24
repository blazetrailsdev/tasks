---
title: "actionmailer, turbo-rails: reach 100% once their blockers land"
status: ready
rfc: "0000-near-complete-packages-to-100"
cluster: small-packages
packages: [actionmailer, turbo]
deps: [stub-any-instance-does-not-intercept-js-new, i18n-railtie-initializers-unported]
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Each package's remaining tests are skips waiting on a story that is already
`blocked` elsewhere (measured 2026-11-24 at trails `4330f807e1`):

- actionmailer: 4, each `BLOCKED: stub-any-instance-does-not-intercept-js-new`
  (`packages/actionmailer/test/delivery-methods.test.ts:143`, `:211`,
  `i18n-with-controller.test.ts:100`, `callbacks.test.ts:98`). That story is
  `blocked` on an operator decision: how `stub_any_instance` intercepts
  `new klass(...)` on Mail's base classes. That decision gates this package's
  100%.
- turbo-rails: 1, `BLOCKED: i18n-railtie-initializers-unported`
  (`packages/turbo/test/streams/streams-controller.test.ts:127`), itself
  waiting on `finisher-awaits-async-load-hooks`.

This story is held by `deps` so it surfaces once both land. If the operator
rules instead that one of them is permanent, the skips take a
`PERMANENT-SKIP:` line citing the ruling, and that dep is removed.

## Acceptance criteria

- [ ] `pnpm parity:test` reports 100.0 for actionmailer and turbo-rails.
- [ ] The five tests run the Rails body and pass, or carry a cited
      `PERMANENT-SKIP:` line.

## Verification

```sh
pnpm parity:test -- --package actionmailer && pnpm parity:test -- --package turbo-rails
```
