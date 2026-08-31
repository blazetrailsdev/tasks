---
title: "No runnable session middleware: request.session is never populated and flash never commits"
status: draft
updated: 2026-08-14
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: ["actionpack"]
deps:
  - splice-finisher-initializers
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

There is no runnable session middleware, so `request.session` is never
populated and `flash` never survives a redirect. An app that wants a login
has to roll its own cookie handling — `examples/twitter-app` does, with a
`TODO` pointing here.

Three linked gaps:

1. **The session store cannot run as middleware.**
   `packages/actionpack/src/action-dispatch/middleware/session/abstract-store.ts:70`
   defines `class Persisted` with `generateSid`, `loadSession`,
   `extractSessionId`, and `commitSession` all throwing
   `NotImplementedError`, each marked
   `@nie disposition=keep-as-strategy-hook rails=rack/lib/rack/session/abstract/id.rb`.
   There is **no `call(env)`** anywhere in the class chain, so
   `CookieStore` (`session/cookie-store.ts:53`) can never be `use`d in a
   stack. Rack's `Rack::Session::Abstract::Persisted#call` / `#context` is
   the unported piece.

2. **`request.session` is a plain object.**
   `packages/actionpack/src/action-dispatch/http/request.ts:651`:

   ```ts
   get session(): Record<string, unknown> {
     return (this.env["rack.session"] as Record<string, unknown>) || {};
   }
   ```

   But `FlashRequestHost`
   (`action-dispatch/middleware/flash.ts:24`) requires a session answering
   `isLoaded()`, `hasKey()`, `get()`, `set()`, `delete()`. Nothing in the
   repo constructs such an object — grep for `"rack.session"` finds only
   plain-object writers in `test-case.ts:375` and `integration.ts:956`.
   Rack's `SessionHash` is the missing type.

3. **`Metal#dispatch` never commits the flash.** Rails
   `vendor/rails/actionpack/lib/action_controller/metal.rb:249-255`:

   ```ruby
   def dispatch(name, request, response)
     set_request!(request)
     set_response!(response)
     process(name)
     request.commit_flash
     to_a
   end
   ```

   `packages/actionpack/src/action-controller/metal.ts:128` omits the
   `request.commit_flash` line. And `Request#commitFlash`
   (`http/request.ts:888`) is `commitFlash(): void {}` — a no-op whose
   comment says "the Flash middleware overrides", but Rails' `Flash`
   middleware is `def self.new(app) app; end`
   (`vendor/rails/actionpack/lib/action_dispatch/middleware/flash.rb:312`),
   a pure passthrough. The real implementation is
   `Flash::RequestMethods#commit_flash`, prepended onto `Request` — which
   trails has ported as a standalone `commitFlash` function
   (`middleware/flash.ts:73`) that nothing calls.

Note for whoever picks this up: adding `ActionDispatch::Flash` to
`default-middleware-stack.ts` is **not** the fix. Rails' entry there is
vestigial. The fix is (1) + (2) + wiring `commitFlash` onto `Request` and
calling it from `Metal#dispatch`.

## Acceptance criteria

- `Rack::Session::Abstract::Persisted#call` / `#context` ported so a session
  store is usable as middleware.
- A `SessionHash` equivalent installed into `env["rack.session"]`, answering
  the `FlashRequestHost` surface; `Request#session` returns it.
- `Request#commitFlash` delegates to the ported `commitFlash`, and
  `Metal#dispatch` calls it after `process`, matching metal.rb:249-255.
- An integration test: set `flash.notice`, redirect, follow the redirect,
  assert the notice renders once and is gone on the request after.
- `examples/twitter-app` drops its hand-rolled cookie session in favour of
  `session[...]`, and its `TODO` referencing this story is removed.
