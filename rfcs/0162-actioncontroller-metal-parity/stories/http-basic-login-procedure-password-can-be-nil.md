---
title: "HttpAuthentication::Basic login_procedure types its nil-able arguments as String"
status: done
updated: 2026-10-06
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8573
claim: "2026-10-06T13:39:34Z"
assignee: "action-name-is-underscored-at-each-template-lookup-site"
blocked-by: null
closed-reason: null
---

## Context

`HttpAuthentication.Basic.authenticate`
(`packages/actionpack/src/action-controller/metal/http-authentication.ts`) calls
`loginProcedure(...userNameAndPassword(request))` through a cast to
`[string, string]`, and types the block `(userName: string, password: string)`.
Rails' `login_procedure.call(*user_name_and_password(request))`
(`actionpack/lib/action_controller/metal/http_authentication.rb:107-109`) splats
`decode_credentials(request).split(":", 2)` (`:119`), which has one element for a
credential with no colon and none for an empty one, so the block sees `nil` for
the password, or for both. `http_basic_authentication_test.rb:154-160` asserts
`password: nil`. The same block type is repeated on `authenticateWithHttpBasic`
and `authenticateOrRequestWithHttpBasic`, so a caller that writes
`password.length` type-checks and throws.

## Acceptance criteria

- The three `loginProcedure` parameters are typed
  `(userName: string | undefined, password: string | undefined)` and the cast in
  `Basic.authenticate` is gone.
- A type test covers a block reading the password without a nil check.
