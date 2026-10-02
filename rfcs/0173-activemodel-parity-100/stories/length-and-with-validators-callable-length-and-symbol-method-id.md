---
title: "activemodel: LengthValidator treats a function as responding to length; WithValidator normalises the method id Rails passes through"
status: done
updated: 2026-10-02
rfc: "0173-activemodel-parity-100"
cluster: null
packages: ["activemodel", "ruby-compat"]
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: trails#8415
claim: "2026-10-02T18:22:00Z"
assignee: "activerecord-node-guards-admit-attribute-and-sql-literal"
blocked-by: null
closed-reason: null
---

## Context

Two small residues of trails PR 8386 in `packages/activemodel/src/validations/`.

1. `LengthValidator#validate_each`
   (`vendor/rails/v8.0.2/activemodel/lib/active_model/validations/length.rb:52`) is
   `value.respond_to?(:length) ? value.length : value.to_s.length`. The port
   (`validations/length.ts:95-97`) asks `rbObjRespondTo(value, "length")`, which answers true for
   a JS function, whose `length` is its arity. A Ruby `Proc` does not respond to `length`, so
   Rails takes the `to_s.length` arm for it.
2. `WithValidator#validate_each` (`validations/with.rb:8-16`) hands `options[:with]` straight to
   `record.method(method_name)` and `record.send method_name`, which take a Symbol or a String.
   The port (`validations/with.ts:15`) first normalises the name with
   `symbolToS(stringToSym(this.options.with))`, because `rbObjMethod` and `rbFSend`
   (`packages/ruby-compat/src/method.ts:76`, `object.ts:361`) take a bare method id and miss on
   `":name"`. Rails has no such step.

## Acceptance criteria

- [ ] `LengthValidator#validateEach` takes the `to_s.length` arm for a function value, by
      whatever `respond_to?(:length)` spelling ruby-compat settles on for callables, with a
      `.trails.test.ts` case.
- [ ] `rbObjMethod` / `rbFSend` accept a `":name"` Symbol as MRI's `rb_check_id` does, or the
      decision that they do not is recorded where they are defined; `WithValidator#validateEach`
      then passes `options.with` through unnormalised.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green.
