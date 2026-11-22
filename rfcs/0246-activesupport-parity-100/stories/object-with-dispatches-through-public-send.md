---
title: "Object#with dispatches through public_send, not a hand-rolled property writer"
status: in-progress
updated: 2026-11-22
rfc: "0246-activesupport-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#10607
claim: "2026-11-22T22:24:08Z"
assignee: "activesupport-cache-format-version-accessor-property"
blocked-by: null
closed-reason: null
---

# Object#with dispatches through public_send, not a hand-rolled property writer

## Context

`vendor/rails/v8.0.5.2/activesupport/lib/active_support/core_ext/object/with.rb:26-39` reads each
old value with `public_send(key)` and writes with `public_send("#{key}=", value)`, so a missing
reader or writer raises `NoMethodError` from Ruby's dispatch. trails' `with_`
(`packages/activesupport/lib/core-ext/object/with.ts`, exported as `with` since trails#10566)
uses three helpers Rails does not have instead:

- an invented `key in target` guard that throws its own `NoMethodError("undefined method '…'")`;
- a direct `target[key]` read;
- a module-private `publicSendWriter` that walks the prototype chain for a getter-only descriptor.

The `_isThenable` async arm is tracked separately in `object-with-awaits-async-block`.

## Acceptance criteria

- [ ] The reads and writes are the member calls Rails makes, spelled directly per CLAUDE.md
      § "A dispatch by name is spelled directly" (here the key is caller-supplied, so `rbFSend`
      is the `public_send` port). `publicSendWriter` and the `key in target` guard are deleted.
- [ ] `with.test.ts` (Rails `core_ext/object/with_test.rb`) stays green, NoMethodError cases included.
