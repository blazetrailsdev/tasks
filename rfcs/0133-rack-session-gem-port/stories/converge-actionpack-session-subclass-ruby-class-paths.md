---
title: "Resolve rubyClassPath for Session subclasses defined outside session.ts, so NullSessionHash and TestSession render their own Ruby constant paths"
status: draft
updated: 2026-09-02
rfc: "0133-rack-session-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`converge-request-session-inspect-onto-receiver-class` (PR #7384) gave
`packages/actionpack/src/action-dispatch/request/session.ts` a module-local
`rubyClassPath` switch so `Session#inspect`'s not-yet-loaded arm interpolates the
RECEIVER's constant path, the way Ruby's `self.class` does
(`vendor/rails/actionpack/lib/action_dispatch/request/session.rb:225`).

The switch maps `Session` alone and falls through to `(klass as {name}).name` for
everything else, exactly as `rubyClassPath` in
`packages/rack-session/src/abstract/id.ts` did before its own slot story. trails
has two `Session` subclasses declared in OTHER files, so both render a bare JS
name rather than a Ruby constant path:

- `NullSessionHash` (`packages/actionpack/src/action-controller/metal/request-forgery-protection.ts:60`)
  — Rails' is
  `ActionController::RequestForgeryProtection::ProtectionMethods::NullSession::NullSessionHash`
  (`vendor/rails/actionpack/lib/action_controller/metal/request_forgery_protection.rb:270`).
- `TestSession` (`packages/actionpack/src/action-controller/test-case.ts:718`) —
  Rails' is `ActionController::TestSession`
  (`vendor/rails/actionpack/lib/action_controller/test_case.rb:197`).

So `NullSessionHash#inspect` renders `#<NullSessionHash:0x… not yet loaded>`
where Ruby renders the full path. No test pins it today.

`session.ts` cannot import either file back — both import `session.ts` to
subclass `Session`, so the import would close a cycle whose participants include
a `class X extends Session`.

## Converged shape

The settled trails idiom is the zero-import slot module (CLAUDE.md,
"Call-time constant resolution"), which
`converge-ruby-class-path-for-out-of-module-stores` shipped for rack-session as
`packages/rack-session/src/ruby-class-path-slot.ts`: a file with no runtime
imports exporting a registry plus a setter, which the DEFINING module calls at
the bottom of its own body and which `rubyClassPath` consults before its
`default` arm. Mirror that in actionpack, and register both subclasses from
their own files.

Whatever carries the names must not become measured surface — a module-local
registry or a `@noRailsEquivalent` receipt, the same constraint the two prior
`rubyClassPath` stories shipped under.

## Acceptance criteria

- `NullSessionHash` and `TestSession` each render their own Ruby constant path
  from `Session#inspect`'s not-yet-loaded arm, without `session.ts` importing
  either defining module.
- A test pins the string for each.
- `pnpm parity:api:extra --package actionpack` gains no novel name.
- The mechanism reuses the documented slot shape rather than re-deriving one.
