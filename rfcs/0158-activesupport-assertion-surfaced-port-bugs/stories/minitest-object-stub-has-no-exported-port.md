---
title: "Minitest Object#stub has no exported port"
status: draft
updated: 2026-10-06
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Minitest's `Object#stub` (`vendor/minitest/v5.27.0/lib/minitest/mock.rb`,
`def stub name, val_or_callable, *block_args, **block_kwargs, &block`) has no
exported port. activesupport carries a module-private `stub(object,
methodName, replacement, block)` in
`packages/activesupport/src/testing/method-call-assertions.ts`, used only by
the `assert_called*` helpers; it takes a replacement function only, not
Minitest's value-or-callable.

Rails tests that call `obj.stub :name, value do ... end` therefore have no
faithful spelling. `RequestForgeryProtectionTests`
(`vendor/rails/v8.0.2/actionpack/test/controller/request_forgery_protection_test.rb:440-558,774`)
is ported in
`packages/actionpack/src/action-controller/controller/request-forgery-protection.test.ts`
with `vi.spyOn(controller, "formAuthenticityToken").mockReturnValue(token)`
restored through `rbEnsure`, ten times inline, and
`CookieCsrfTokenStorageStrategyControllerTest` in the same file has a
file-local `stubFormAuthenticityToken` helper. `vendor/rails/v8.0.2/actionpack/test`
alone has about 100 `.stub` call sites.

## Acceptance criteria

- [ ] Minitest's `Object#stub` is ported at its Minitest name with its
      value-or-callable arm, restoring when the block's promise settles, and
      exported for test use.
- [ ] `method-call-assertions.ts` uses that port in place of its private
      `stub`.
- [ ] The ten inline `vi.spyOn` / `rbEnsure` spans and the file-local
      `stubFormAuthenticityToken` in `request-forgery-protection.test.ts` are
      rewritten onto it.
