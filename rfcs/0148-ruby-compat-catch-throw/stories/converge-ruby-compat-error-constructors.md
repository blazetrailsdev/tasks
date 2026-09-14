---
title: "Drop invented constructors from ruby-compat core error classes"
status: draft
updated: 2026-09-14
rfc: "0148-ruby-compat-catch-throw"
cluster: null
packages: []
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

Surfaced by trails#7758. Ruby core exception classes define no `initialize` of
their own (`vendor/ruby/error.c:3320-3330` `rb_define_class("KeyError", rb_eIndexError)`
etc.), yet several ruby-compat ports declare a constructor whose only job is
`this.name = "X"`. Each one scores a moved extra (`constructor`) in
`pnpm parity:api:extra --package ruby-compat`:

- `packages/ruby-compat/src/key-error.ts` (message-only)
- `packages/ruby-compat/src/float-domain-error.ts` (message-only)
- `packages/ruby-compat/src/no-method-error.ts` / `name-error.ts` (NameError's ctor also sets `constantName`)
- `packages/ruby-compat/src/type-error.ts`, `runtime-error.ts`, `frozen-error.ts`, `not-implemented-error.ts` (default message = class name, Ruby's `exc_to_s` nil-mesg arm `error.c`)

trails#7758 converged `ArgumentError` onto `StandardError`'s shape
(`export class X extends Parent {}` + `X.prototype.name = "X"`). A default
message equal to the class name needs care: JS `Error()` gives `""`, so the
shape there is the `io-error.ts` `super(message ?? new.target.name)` parent
pattern, not a per-subclass constructor.

## Acceptance criteria

- [ ] Message-only error classes carry no constructor; `name` comes from the prototype.
- [ ] Default-message classes derive it once in a parent via `new.target`.
- [ ] Existing ruby-compat, activesupport and i18n tests pass; `.name` / `.message` unchanged.
- [ ] `pnpm parity:api:extra:gate` ruby-compat `total` drops; mark tightened.
