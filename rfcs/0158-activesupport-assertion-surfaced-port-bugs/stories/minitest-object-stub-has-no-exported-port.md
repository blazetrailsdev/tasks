---
title: "request-forgery-protection tests hand-roll Minitest Object#stub with vi.spyOn"
status: ready
updated: 2026-10-22
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Minitest's `Object#stub` (`vendor/minitest/v5.27.0/lib/minitest/mock.rb`,
`def stub name, val_or_callable, *block_args, **block_kwargs, &block`) is now
ported and exported as `stub(object, name, valOrCallable, blockArgs, block)`
(`packages/activesupport/src/testing/method-call-assertions.ts:248`, trails#8867),
and the `assert_called*` helpers in that file use it (`:105`, `:130`).

`RequestForgeryProtectionTests`
(`vendor/rails/v8.0.2/actionpack/test/controller/request_forgery_protection_test.rb:440-558,774`)
calls `@controller.stub :form_authenticity_token, token do ... end`. The port in
`packages/actionpack/src/action-controller/controller/request-forgery-protection.test.ts`
still spells it as `vi.spyOn(controller, "formAuthenticityToken").mockReturnValue(token)`
restored through `rbEnsure` (11 `spyOn` sites), and
`CookieCsrfTokenStorageStrategyControllerTest` keeps a file-local
`stubFormAuthenticityToken` helper (`:1431`).

## Acceptance criteria

- [ ] Every `formAuthenticityToken` stub in that file is
      `stub(controller, "formAuthenticityToken", token, [], async () => { … })`,
      as the Rails body is, and the file-local `stubFormAuthenticityToken` is
      deleted.
- [ ] The file's tests stay green with unchanged names.
