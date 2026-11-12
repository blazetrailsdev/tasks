---
title: "Contact/Address test models camelize instance_values keys instead of calling it directly"
status: draft
updated: 2026-11-12
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
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

Rails' test models call `instance_values` directly:
`vendor/rails/v8.0.2/activemodel/test/models/contact.rb:40`
(`instance_values.except("address", "friends", "contact")`) and
`vendor/rails/v8.0.2/activemodel/test/models/address.rb:13`.

Since trails#10023, `InstanceVariablesObject.instanceValues`
(`packages/activesupport/lib/core-ext/object/instance-variables.ts`) keys by the
Ruby ivar name (`created_at`). trails' `packages/activemodel/test/models/contact.ts`
and `address.ts` wrap it in a module-private `instanceValues` that strips a
leading `_` and `camelize(..., false)`s each key back to `createdAt`, because
`Serialization#read_attribute_for_serialization`
(`packages/activemodel/lib/serialization.ts:134`, Rails `serialization.rb`)
dispatches the attribute name through `rbFSend`, and `rbFSend(contact, "created_at")`
raises `NoMethodError` (the model's reader is `createdAt`).

## Converged shape

`attributes` is `exceptBang(InstanceVariablesObject.instanceValues(this), "address", "friends", "contact")`
with no wrapper, and the model's fields declare their Ruby ivars
(`rbDeclareIvar`), the key spelling the serializer reads matching the attribute
name it dispatches. Decide whether the attribute name a serializer reads is the
Ruby ivar key or the trails camelCase attribute name, and make
`instance_values` and `read_attribute_for_serialization` agree on it.

## Acceptance criteria

- The local `instanceValues` wrappers in `contact.ts` / `address.ts` are deleted.
- `json-serialization.test.ts`, `serialization.test.ts`, `dirty.test.ts` stay green with no renamed tests.
