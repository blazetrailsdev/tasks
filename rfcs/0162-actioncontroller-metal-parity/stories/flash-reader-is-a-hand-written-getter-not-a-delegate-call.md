---
title: "flash-reader-is-a-hand-written-getter-not-a-delegate-call"
status: draft
updated: 2026-10-10
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
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

`ActionController::Flash`'s `included` block is `delegate :flash, to: :request`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/flash.rb:11`).
`packages/actionpack/src/action-controller/metal/flash.ts` defines the reader
with `Object.defineProperty(this.prototype, "flash", { get: flash })` and
carries `@missingRailsCall delegate`.

A plain `delegate.call(this.prototype, "flash", { to: "request" })` does not
converge it. `Delegation.generate`
(`packages/activesupport/src/delegation.ts:60-185`) emits an accessor only when
it can find the target member's descriptor on a `receiverClass`, and it has a
`receiverClass` only for a non-String `to` or for `to: :class`. With the String
target `"request"` it emits a method, so `controller.flash` becomes
`controller.flash()` while `request.flash`
(`packages/actionpack/src/action-dispatch/http/request.ts:587`) stays a getter,
and about 25 `this.flash` / `controller.flash` reads in actionpack break,
`redirectTo` in `flash.ts` and `etag-with-flash.ts:18-19` among them.

Found while closing `base-included-modules-dispatch-privates-through-self`,
which converged the rest of that story and left this one arm.

## Acceptance criteria

- `Flash`'s `included` block calls `delegate` for `flash` with `to: "request"`
  where `flash.rb:11` does, and the hand-written `flash` getter and its
  `Object.defineProperty` are gone.
- `controller.flash` reads the same way `request.flash` does, decided once in
  `Delegation.generate` for a String target whose member is an accessor.
- The `@missingRailsCall delegate` receipt on `Flash` is deleted.
