---
title: "Port builder's Ruby 1.8 $KCODE arm of TestUtfMarkup under its own guard"
status: draft
updated: 2026-11-09
rfc: "0000-small-gem-tail-parity"
cluster: null
packages:
  - "builder"
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test` builder 96/98. `vendor/builder/v3.3.0/test/test_markupbuilder.rb`
`TestUtfMarkup` (:460-500) defines "use entities if no encoding is given and
kcode is none" and "use entities if encoding is utf but kcode is not" in both
arms of `if ! String.method_defined?(:encode)`: the `$KCODE` arm (:470, :477)
for Ruby 1.8, and the `else` arm (:488, :494) for every Ruby since.
`packages/builder/test/markupbuilder.test.ts:472-483` ports the `else` arm only.
The extractor counts both arms, as Ruby defines whichever arm the guard picks.

## Acceptance criteria

- [ ] The `$KCODE` arm is ported inside `describe("TestUtfMarkup")` with the
      same two names, under a `skipIf` on the ported
      `String.method_defined?(:encode)` guard. It is therefore skipped on every
      runtime, as on Ruby 3, and is not a `PERMANENT-SKIP`. The duplicate names
      sit in one describe, as in the Ruby class.
- [ ] `pnpm parity:test --package builder` reports 98/98.
