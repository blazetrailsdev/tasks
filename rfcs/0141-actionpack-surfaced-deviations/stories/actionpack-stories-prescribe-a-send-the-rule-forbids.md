---
title: "actionpack: seven stories' acceptance criteria prescribe rbFSend where the rule requires the direct call"
status: done
updated: 2026-10-22
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: tasks#292
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

CLAUDE.md § "A dispatch by name is spelled directly (`send`, `public_send`)" (merged
trails#9143) says in terms: "**A story does not propose a send.** When filing or sizing work,
name the direct call in the acceptance criteria."

Seven actionpack stories still prescribe the forbidden shape in their acceptance criteria, and
**two of them are `ready`**, so the next agent to claim one is instructed to write what the
ratified rule forbids:

- `constraints-call-dispatches-app-call` (ready) — criterion reads
  "`Constraints.CALL` is `rbFSend(app, "call", req.env)`". Rails
  `Constraints::CALL` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb`)
  is `->(app, req) { app.call req.env }`.
- `middleware-constructors-accept-call-able-app` (ready) — same `rbFSend(this.app, "call", env)`
  shape, around `Middleware#build`
  (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/stack.rb:43-45`).
- `polymorphic-routes-dispatch-hand-rolls-public-send`, `public-exceptions-render-dispatches-to-format`,
  `debug-exceptions-public-sends-to-format`, `collector-method-missing-resends-the-name-it-was-given`,
  `enroll-actiondispatch-in-naming-gate` — each names `rbFPublicSend` as the converged shape.

Not all seven are wrong: a format dispatch and `Collector#any` may land in the rule's third
arm (a caller-supplied, open-ended name). The two `app.call` ones are the live hazard, and the
honest answer there is NOT a bare `app.call(env)`: for a bare function that is
`Function.prototype.call` with `env` as `thisArg`, which is why ruby-compat's send is in the
port at all. The typed shape has to be settled — a `RackAppObject` the middleware constructors
accept, so the member call is real — not swapped for a dot-call that silently changes
semantics.

Surfaced while sweeping the backlog for trails#9143.

## Converged shape

Each of the seven stories' acceptance criteria names the direct member call (with the typing
that makes it real) or, where the dispatched name is genuinely caller-supplied and open-ended,
says so explicitly and cites the rule's third arm. No criterion prescribes `rbFSend` /
`rbFPublicSend` as the target shape.

## Acceptance criteria

- [ ] `constraints-call-dispatches-app-call` and `middleware-constructors-accept-call-able-app`
      name the typed receiver and the real member call, and note why `app.call(env)` alone is
      not it for a bare function.
- [ ] The other five are each either rewritten to the direct call or annotated with the rule's
      third arm and the reason the name is open-ended.
- [ ] A markdown-only PR in the tasks repo (story prose is markdown-owned), no DB-owned field
      touched.
