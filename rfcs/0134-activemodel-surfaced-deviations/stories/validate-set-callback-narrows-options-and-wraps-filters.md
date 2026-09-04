---
title: "validate-set-callback-narrows-options-and-wraps-filters"
status: draft
updated: 2026-09-04
rfc: "0134-activemodel-surfaced-deviations"
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

Surfaced converging `model-validate-is-not-variadic` (PR #7469).

Rails' `validate` ends in `set_callback(:validate, *args, options, &block)`
(`vendor/rails/activemodel/lib/active_model/validations.rb:184`) — the filters
go through untouched and the whole options hash is forwarded. trails'
`ClassMethods.validate` (`packages/activemodel/src/validations.ts`) diverges on
both halves of that call:

1. **The options hash is narrowed** to `{ if, unless, prepend }` instead of
   being forwarded whole. Forwarding it whole is what the port wants, but
   activesupport's `isCallbackOptions`
   (`packages/activesupport/src/callbacks.ts:1012-1019`) refuses a hash with any
   function-valued key other than `if`/`unless`, and `validates_with` puts
   `options[:class] = self` — a class, i.e. a JS function — into the hash it
   forwards (`vendor/rails/activemodel/lib/active_model/validations/with.rb:88-104`,
   ported at `packages/activemodel/src/validations/with.ts:80`). The hash is then
   taken as a _filter_ and reaches `ObjectCall`, which raises
   "undefined method 'validate' for callback object". Ruby's
   `args.extract_options!` inside `set_callback` pops the trailing hash
   unconditionally, with no such heuristic.

2. **Each filter is wrapped in a closure** rather than passed straight through
   as Rails passes its Symbols and procs. The wrapper exists only to raise
   `NoMethodError` for a method name the record does not answer;
   `MethodCall#makeLambda` (`packages/activesupport/src/callbacks.ts:94-98`)
   reaches the method with `?.()`, so a missing one silently no-ops where Ruby
   raises.

Both are activesupport-callbacks gaps surfacing as a validations deviation, which
is why they were left out of #7469's scope. The `validate` body carries a
`@missingRailsArgs set_callback` receipt pointing here.

## Acceptance criteria

- [ ] `set_callback`'s trailing-hash detection matches Ruby's
      `args.extract_options!`, so a hash carrying a class (or any other
      function-valued key) is still taken as options.
- [ ] A string filter reaching a record that does not answer it raises
      `NoMethodError`, matching Ruby.
- [ ] `ClassMethods.validate` then reads
      `this.setCallback("validate", ...filters, options)` — no per-filter
      closure, no narrowed hash — mirroring validations.rb:184, and its
      `@missingRailsArgs` receipt is deleted.
- [ ] parity:api / parity:test delta non-negative; no new call-argument
      baseline row.
