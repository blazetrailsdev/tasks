---
title: "activemodel: Error.generate_message's value is a promise for an unloaded singular association"
status: ready
updated: 2026-10-08
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced landing trails#8663, which made `read_attribute_for_validation` `send`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/validations.rb:437`).

`Error.generate_message` reads the attribute's value for `%{value}` interpolation
(`vendor/rails/v8.0.2/activemodel/lib/active_model/error.rb:66`):

```ruby
value = (attribute != :base ? base.read_attribute_for_validation(attribute) : nil)
```

In Ruby that is the association reader, which loads its target in line. In trails
(`packages/activemodel/src/error.ts` `generateMessage`) the read is synchronous and
`SingularAssociation#reader` (`packages/activerecord/src/associations/singular-association.ts`)
answers a promise when the association is not loaded. So for an error added to an unloaded singular
association outside validation (`reply.errors.add("topic", ":invalid")`):

- `value` is a `Promise`, and a `%{value}` message interpolates `[object Promise]`;
- reading the message starts a query nobody awaits, whose rejection is unhandled.

`packages/activerecord/src/validations/association-validation.trails.test.ts` "an error added to an
unloaded singular association outside validation reads the reader's promise as value" pins the
current arm. After validation the association is loaded and `value` is the record.

`Error#message` (`error.rb:150-158`) is a synchronous getter, so it cannot await the read.

## Acceptance criteria

- [ ] Reading an error's message on an unloaded singular association starts no un-awaited query and leaves no unhandled rejection.
- [ ] `value` in that arm is decided and recorded: the loaded record through an awaitable path, or `nil` as an unloaded target, and the pinned test is updated to it.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green with no new row.
