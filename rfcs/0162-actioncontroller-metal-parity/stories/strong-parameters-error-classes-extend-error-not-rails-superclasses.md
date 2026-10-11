---
title: "strong_parameters error classes extend Error, not ArgumentError / IndexError; InvalidParameterKey has an invented constructor"
status: draft
updated: 2026-10-11
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Three error classes in
`packages/actionpack/src/action-controller/metal/strong-parameters.ts` do not
have the superclass Rails gives them, and one carries an invented constructor
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/strong_parameters.rb`):

- `InvalidParameterKey` is `class InvalidParameterKey < ArgumentError; end`
  (`:84-85`), with no `initialize`. The port `extends Error` and declares a
  constructor whose default message, "all keys must be Strings or Symbols", is
  not in Rails. The only raise site, `Parameters#initialize` (`:288-292`),
  always passes the message.
- `UnfilteredParameters` is `< ArgumentError` (`:74-78`). The port
  `extends Error`.
- `UnpermittedParameters` is `< IndexError` (`:59-66`). The port
  `extends Error`.

Each port also assigns `this.name` by hand. `ArgumentError` is in
`packages/ruby-compat/src/argument-error.ts`. A `rescue ArgumentError` /
`rescue IndexError` ported as an `instanceof` test does not catch these today.

## Acceptance criteria

- [ ] `InvalidParameterKey` extends ruby-compat's `ArgumentError` and has no
      constructor of its own.
- [ ] `UnfilteredParameters` extends `ArgumentError` and `UnpermittedParameters`
      extends `IndexError`, each keeping the Rails `initialize` body.
- [ ] The hand-assigned `this.name` lines go where the class name is already
      read through `rbModName`, or are shown to be needed.
