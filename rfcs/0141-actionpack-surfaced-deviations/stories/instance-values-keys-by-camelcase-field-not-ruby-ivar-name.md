---
title: "instance-values-keys-by-camelcase-field-not-ruby-ivar-name"
status: draft
updated: 2026-09-26
rfc: "0141-actionpack-surfaced-deviations"
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

`Object#instance_values`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/object/instance_variables.rb:14-18`)
keys each value by its ivar name with the `@` stripped, so a Ruby object with
`@public_id` serializes through `Object#as_json`
(`core_ext/object/json.rb:58-66`) as `{"public_id" => ...}`.

trails' `InstanceVariablesObject.instanceValues`
(`packages/activesupport/src/core-ext/object/instance-variables.ts`) keys by the
JS own-property name, which is the camelCase translation of the ivar
(`publicId`). So every object that reaches `Object.asJson`'s `instance_values`
arm serializes camelCase keys where Rails writes snake_case — a wire-format
difference wherever the JSON leaves the process.

Surfaced converging `csrf-cookie-envelope-serializes-session-id-with-a-camelcase-key`:
Rack's `SessionId` (`packages/rack-session/src/abstract/id.ts`) had to carry an
`asJson` with a `@noRailsEquivalent CONVERGEABLE` receipt pointing here so the
CSRF cookie envelope reads `{"session_id": {"public_id": ...}}` as
`request_forgery_protection.rb:344` expects.

Callers that already undo the translation by hand:
`packages/activemodel/src/test-helpers/models/contact.ts` and `address.ts`
(`instanceValues` wrappers stripping the `_` prefix), `activemodel/src/dirty.test.ts:108`,
`activemodel/src/serialization.test.ts:30,54`.

## Converged shape

`instanceValues` / `instanceVariableNames` map a JS field name back to the Ruby
ivar name (the inverse of the camelCase field rule in
`docs/ruby-ts-conventions.md`), so `Object.asJson` emits Rails' keys. Then
`SessionId#asJson` is deleted and `SessionId` serializes through the
`instance_values` arm exactly as in Ruby.

## Acceptance criteria

- [ ] `instanceValues(new SessionId("x"))` is `{ public_id: "x" }`.
- [ ] `SessionId#asJson` and its receipt are removed; the CSRF CookieStore
      envelope test in `request-forgery-protection.trails.test.ts` still pins
      `{"session_id":{"public_id":...}}`.
- [ ] The activemodel `Contact` / `Address` / dirty / serialization callers are
      re-checked against Rails' expected keys; no test renamed.
