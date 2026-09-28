---
title: "Converge MiddlewareStack, Callbacks and the session stores' invented shapes"
status: draft
updated: 2026-09-27
rfc: "0165-actiondispatch-middleware-parity"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

- `middleware/stack.rb` measures 28/28 since RFC 0141's
  `middleware-stack-build-instrumented-and-instrumentation-proxy-not-ported`
  landed, but `parity:api:extra` still scores `get` and `length` on
  `middleware/stack.ts` as moved.
- `middleware/callbacks.rb`: Rails' `class Callbacks` (`:9`) has no superclass
  and `include ActiveSupport::Callbacks` (`:10`) then `define_callbacks :call`.
  trails declares `class CallbacksBase extends CallbacksMixin() {}` and
  `class Callbacks extends CallbacksBase`
  (`packages/actionpack/src/action-dispatch/middleware/callbacks.ts:8-11`), which
  `pnpm parity:api --inheritance` reports. CLAUDE.md § "Module mixins" gives the
  shape: `include()` onto `Callbacks` itself.
- Session stores, under `packages/actionpack/src/action-dispatch/middleware/session/`:
  `resolveStore` on `index.ts` and on the invented `resolve-store.ts` (no Rails
  file), `initialize` on `abstract-store.ts` (novel), five moved names on
  `cookie-store.ts` (`inspect`, `isEmpty`, `privateId`, `publicId`,
  `toString` — Rails' `Rack::Session::SessionId` readers, so they belong in
  rack-session), `generateSid` on `cache-store.ts`.
- Moved: `interlock`, `defaultCharset` on `debug-locks.ts`; `calculate` on
  `remote-ip.ts`; `instance` on `server-timing.ts`.

## Acceptance criteria

- `Callbacks` has no invented base class; the inheritance row is gone.
- `resolve-store.ts` is deleted; store lookup happens where Rails does it
  (`ActionDispatch::Session` constants resolved by the railtie's
  `session_store`).
- Each moved name is removed or relocated to the file mirroring its `.rb`.
- `pnpm parity:api:extra --package actiondispatch` lists none of these files.
