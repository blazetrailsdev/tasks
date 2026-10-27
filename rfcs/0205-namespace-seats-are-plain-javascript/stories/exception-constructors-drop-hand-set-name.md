---
title: "actionpack exception constructors drop hand-set this.name now that classes are path-seated"
status: in-progress
updated: 2026-10-27
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#9389
claim: "2026-10-27T20:39:19Z"
assignee: "enumerable-free-functions-remaining-loop-and-enumerator-sites"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/exceptions.rb` declares each error as a bare class
(`class RoutingError < ActionControllerError; attr_reader :failures; def initialize(message, failures = []) super(message); @failures = failures; end; end`).
It has no line that sets a name: `Exception#class.name` comes from the constant path. trails#9074 path-seated these classes with
`rbModConstSet`, so `rbObjClassname` now answers `class.name`. But each constructor in
`packages/actionpack/src/action-controller/metal/exceptions.ts`, `request-forgery-protection.ts`,
`strong-parameters.ts`, `abstract-controller/base.ts` (`ActionNotFound`), `action-dispatch/http/parameters.ts`
(`ParseError`), `param-error.ts` and `mime-negotiation.ts` (`InvalidType.prototype.name`) still assigns
`this.name = "..."`. That line is invented, and some of the names are bare, e.g. `"RenderError"`, `"MissingFile"`,
`"SessionOverflowError"`, `"RespondToMismatchError"`, `"ActionControllerError"`.

## Acceptance criteria

- The `this.name` assignments in those constructors are removed, or derived once from `rbObjClassname` in a single
  shared place (e.g. ruby-compat's exception base) instead of being hard-coded per class.
- Error messages and the `inspect` output keep the Ruby class path. Tests that read `error.name` are updated to
  read `rbObjClassname(error)`.

## RFC 0205 note

Do not add a namespace seat to give a class its Ruby path. Since
`derive-class-path-from-registered-namespaces`, `rbModName` / `rbModToS` /
`rbObjClassname` answer a class's path from its package's generated table,
`packages/<pkg>/src/class-paths.generated.ts` (`pnpm parity:class-paths`, gated
in CI), whenever the package entry is loaded. A class missing from it is fixed
by pairing it in `parity:api` (or exporting it), not by a seat. Reach a class
from a method body with a plain ES import; the seat helper is kept only at the
Rails bodies that call `const_set` (CLAUDE.md § "Call-time constant
resolution"). Acceptance criteria below that ask for a seat are read through
this note.
