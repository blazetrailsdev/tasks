---
title: "Shape the JSON API with route format defaults, rescueFrom and a loopback concern"
status: draft
updated: 2026-09-23
rfc: "0136-trailmap"
cluster: null
packages: ["actionpack"]
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

From the trailmap Rails-idiom audit. The JSON API controllers work around
things Rails already has idioms for, and each workaround below is available
in trails today.

1. **Content negotiation by `Accept` header alone.**
   `app/controllers/stories-controller.ts:128-141` bypasses `Base#respondTo`
   and calls the standalone `respondTo(..., { accept: this.request.getHeader("accept") })`.
   The reason is that `request.format` answers html for a request with no
   `Accept`, and ringo's Go client sends none. That is Rails' behaviour too
   (`actionpack/lib/action_dispatch/http/mime_negotiation.rb:67-79` falls
   through to `Mime[:html]`). Rails' answer for an API is to say so in the
   routes: `scope defaults: { format: :json } do ... end`
   (`actionpack/lib/action_dispatch/routing/mapper.rb:1045-1048`). trails ports
   it as `mapper.defaults({ format: "json" }, () => ...)`
   (`packages/actionpack/src/action-dispatch/routing/mapper.ts:731-738`). With
   the format fixed by the route, the actions `render({ json })` directly.
2. **`try/catch` around every mutation.** `MutationsController#run`
   (`mutations-controller.ts:181-195`) catches `VerbExit` and renders the
   refusal. Rails writes `rescue_from VerbExit, with: :render_verb_exit`
   (`activesupport/lib/active_support/rescuable.rb:53`). trailmap's own
   `HealthController` already uses `rescueFrom` (`health-controller.ts:22-26`).
3. **The loopback guard is a free function.**
   `app/controllers/concerns/loopback-only.ts:61-76` returns `false` to halt and
   re-declares request and render shapes to cast into. Rails halts a
   `before_action` because the response was performed
   (`actionpack/lib/abstract_controller/callbacks.rb:34`, the `performed?`
   terminator). trails main does the same (`_wrapBefore`,
   `packages/actionpack/src/abstract-controller/callbacks.ts:165-172`), so once
   the vendored pin includes it, the `return false` protocol is dead. Confirm
   against `node_modules/@blazetrails/actionpack` before relying on it. It belongs in a `LoopbackOnly` concern
   mixed in with `include()`, with a `requireLoopback()` instance method.
   Registering it by name (`beforeAction("requireLoopback")`) waits on
   `before-action-does-not-accept-a-method-name` (RFC 0141). Until then, pass
   `(c) => c.requireLoopback()` from the concern's included hook.
4. **Per-controller param helpers.** `param` / `intParam` / `prParam` are
   re-implemented privately in two controllers (`mutations-controller.ts:235-252`,
   `stories-controller.ts:143-153`) over `this.params.get(...)`. Rails reads
   `params[:rfc].presence`, `params.fetch(:ids)`, and
   `Integer(params[:max_loc], exception: false)`. Use the `Parameters` API
   (`fetch`, `presence`) and move what's left, such as `repo#N` parsing, to one
   shared place.

## Acceptance criteria

- The JSON API routes (`config/routes.ts:33-62`) sit inside
  `mapper.defaults({ format: "json" }, ...)`. The standalone `respondTo` import
  and the `Accept`-header plumbing are gone, and a request with no `Accept` and
  one with `*/*` both get JSON (the existing tests).
- One behaviour change follows, and it is Rails': with the format fixed by the
  route, an `Accept: text/html` request gets JSON, not the current 406
  (`test/controllers/stories-controller.test.ts:180-183`). Update that one test
  and call it out in the PR body. These routes are loopback-only, and no
  browser is their audience.
- `VerbExit` is handled with `rescueFrom` on `MutationsController`, with no
  `try/catch` in the actions. HTTP status and body are unchanged.
- The loopback guard is a concern with an instance method and no `as unknown as`
  casts, halting by rendering.
- No controller defines its own `param()` helper.
- `test/controllers/*` pass with no other assertion changes.
