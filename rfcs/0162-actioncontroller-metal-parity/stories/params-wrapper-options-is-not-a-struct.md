---
title: "ParamsWrapper::Options is a hand-rolled class with its own toH, not a Struct with super readers"
status: ready
updated: 2026-10-06
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
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

Rails' `ActionController::ParamsWrapper::Options` is a Struct —
`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/params_wrapper.rb:88`
`class Options < Struct.new(:name, :format, :include, :exclude, :klass, :model)` —
that overrides three of its own readers (`model` `:104-106`, `include` `:108-139`,
`name` `:141-153`), each calling `super` for the raw slot. `wrap_parameters`
(`:235`) then reads the raw slots back through `Struct#to_h`
(`rb_struct_to_h`, `vendor/ruby/v3.3.11/struct.c`):
`Options.from_hash _wrapper_options.to_h.slice(:format).merge(options)`.

trails' `Options` (`packages/actionpack/src/action-controller/metal/params-wrapper.ts`)
is a plain class with hand-written `_name` / `_include` / `_model` backing fields
and a hand-written `toH()` carrying
`@noRailsEquivalent CONVERGEABLE params-wrapper-options-is-not-a-struct`, because
ruby-compat's `Struct.new` (`packages/ruby-compat/src/struct.ts`) cannot express
the shape:

- it stores each member as an own data property written in the constructor, so a
  subclass accessor of the same name receives the write and there is no slot left
  for the overriding reader's `super` to read;
- `structValues` reads `s[member]`, which would run the lazy overriding readers,
  where MRI's `to_h` / `==` / `hash` read the raw slots;
- it has no `to_h` at all.

## Acceptance criteria

- ruby-compat's `Struct` keeps member values in a slot a subclass reader can reach
  as `super` (the settled spelling decided there), and `structValues` reads that
  slot, never the overridable reader.
- `Struct#to_h` is ported onto ruby-compat's `Struct` from `rb_struct_to_h`, with
  its `@noRailsEquivalent PERMANENT` receipt.
- `Options` becomes `class Options extends Struct.new("name", "format", "include",
"exclude", "klass", "model")`; its `_name` / `_include` / `_model` backing
  fields and its own `toH()` (with the CONVERGEABLE receipt) are deleted, and the
  three readers read `super`.
- `Options#include` and `#name` take the `@mutex.synchronize` re-check only if
  their bodies gain an `await` (CLAUDE.md § "The pool monitor guards only
  sections that span an `await`").
- `pnpm parity:api:extra --package actioncontroller` loses the `toH` row.
