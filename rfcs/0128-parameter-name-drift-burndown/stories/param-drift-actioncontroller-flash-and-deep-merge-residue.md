---
title: "param-drift-actioncontroller-flash-and-deep-merge-residue"
status: draft
updated: 2026-08-31
rfc: "0128-parameter-name-drift-burndown"
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

`param-drift-actioncontroller-structural-residue` converged 7 of actioncontroller's
9 parameter-name rows (PR pending: `respond_to`'s dropped `*mimes`, the two
`log_at` rows, `BrowserBlocker#initialize`, the three
`RequestForgeryProtection` storage-strategy rows, and both `assert_template`
rows). Two rows survive, each needing its own structural decision, and
actioncontroller's mark in `scripts/api-compare/param-name-mark.json` is
narrowed to 2.

### 1. `metal/flash.rb#redirect_to` @1 — one TS method for two Ruby spellings

`ActionController::Base#redirect_to(options = {}, response_options = {})`
(`actionpack/lib/action_controller/metal/redirecting.rb:75`) and
`Flash#redirect_to(options = {}, response_options_and_flash = {})`
(`metal/flash.rb:53`) name their second parameter differently. trails has one
method, `packages/actionpack/src/action-controller/base.ts:redirectTo`, whose
body is the `redirecting.rb` port and whose `responseOptions` therefore matches
that declaration; the `flash.rb` one is charged a rename. Naming it
`responseOptionsAndFlash` only moves the row onto `redirecting.rb`.

It clears only once the Flash layer has its own `redirect_to` declaration —
i.e. `packages/actionpack/src/action-controller/metal/flash.ts` (today a
bespoke `FlashTypeRegistry`, no `redirect_to` at all) grows the flash-extraction
half as a `this`-typed function and `base.ts` stops declaring the method
itself. The blocker is Ruby's `super(options, response_options_and_flash)`
(`flash.rb:64`): a `this`-typed mixin function has no `super`, so the
`redirecting.rb` body has to move out of `base.ts` into
`metal/redirecting.ts` (which already holds the rest of that module as
`this`-typed functions) for the Flash layer to delegate to by name.

### 2. `metal/strong_parameters.rb#deep_merge?` — a predicate colliding with the method it guards

Unchanged from the parent story, and deliberately left: `Parameters#deep_merge?(other_hash)`
(`metal/strong_parameters.rb:1027`, `:nodoc:`) normalises onto the TS name
`deepMerge` under `docs/ruby-ts-conventions.md` (a `?` predicate drops the
mark), which
`packages/actionpack/src/action-controller/metal/strong-parameters.ts:294`
already uses for the port of `ActiveSupport::DeepMergeable#deep_merge(other, &block)`
(`activesupport/lib/active_support/deep_mergeable.rb:29`). The comparer scores
the alias against `deepMerge(other)` and reports `other` as a rename of
`other_hash`. `param-drift-actioncontroller` briefly spelled it `otherHash`;
review reverted that, because it adopts the WRONG method's identifier — the
implementing method names it `other`, as
`packages/activesupport/src/deep-mergeable.ts:43` already does. Same shape as
`param-drift-rack-structural-residue`'s `headers.rb#key?` row, and the two
should be decided together.

## Acceptance criteria

- The Flash layer carries its own `redirect_to` declaration with Rails'
  `response_options_and_flash`, and `base.ts` no longer declares the method,
  or the position is a `pnpm tasks block` naming the language shortcoming.
- The `deep_merge?` alias collision is decided together with
  `param-drift-rack-structural-residue`'s `headers.rb#key?` row — converged, or
  blocked with the comparer behaviour named.
- actioncontroller's mark in `scripts/api-compare/param-name-mark.json` is
  narrowed with `pnpm parity:api:params:tighten` (never rewritten upward), and
  `pnpm parity:api:params` reports actioncontroller 0/0.
- No test renamed; `pnpm parity:api` methods/arity unmoved, `parity:api:calls`
  and `parity:api:calls:args` no new row.
