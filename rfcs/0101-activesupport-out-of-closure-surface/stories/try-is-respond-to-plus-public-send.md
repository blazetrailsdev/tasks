---
title: "try / try! are respond_to? + public_send in core-ext/object/try.ts, one port"
status: closed
updated: 2026-11-20
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Duplicate of 0158 try-bang-has-two-ports-and-neither-is-public-send (in-progress, trails#10412), whose AC also converges try onto try.rb:7-17."
---

## Context

`ActiveSupport::Tryable#try`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/object/try.rb:8-18`)
is, for the method-name form, `public_send(*args, &block) if respond_to?(args.first)`;
`try!` (`:21-31`) is the bare `public_send`.

trails' `tryCall` / `tryBang` (`packages/activesupport/src/try.ts`) are
hand-rolled property probes: `tryCall` reads `obj[method]`, applies it when it
is a function, answers a non-function member only for zero arguments, and
since trails#8577 falls through to `rbObjRespondTo` + `rbFPublicSend` as a
last arm. A second copy, `Tryable.try` / `Tryable.tryBang`
(`packages/activesupport/src/core-ext/object/try.ts`), has the same probe
without the fall-through, and `tryBang` raises `TypeError` where `public_send`
raises `NoMethodError`. Neither lives at the Rails file under the Rails name
with the Rails body.

## Acceptance criteria

- One `try` / `tryBang` port in `core-ext/object/try.ts` whose method-name arm
  is `rbObjRespondTo(obj, name) ? rbFPublicSend(obj, name, ...args) : null`
  and `rbFPublicSend(obj, name, ...args)`, plus the block arms Rails has.
- `packages/activesupport/src/try.ts` is deleted or re-exports that port; the
  six production callers (`conditional-get.ts`, `renderable.ts`,
  `associations/association.ts`, `relation/calculations.ts`) keep passing.
- `tryBang` on an undefined name raises `NoMethodError`.
