---
title: "ActiveModel and ActiveRecord read Parameters#to_h as a Hash, not a deep plain object"
status: draft
updated: 2026-10-10
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while attempting
`parameters-to-h-returns-a-plain-object-not-hash-with-indifferent-access`.
Making `Parameters#toH` / `#toUnsafeH` return a `HashWithIndifferentAccess`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/strong_parameters.rb:326-397`,
`:1156-1170`) is about 60 LOC inside
`packages/actionpack/src/action-controller/metal/strong-parameters.ts`, and the
actionpack / actionview suites then fail in only 16 tests. The blocker is every
ActiveModel / ActiveRecord reader of `attributes.to_h`, which reads the result
as a deep plain object, so a `HashWithIndifferentAccess` (a `Map`) silently
assigns nothing:

- `sanitizeForMassAssignment`
  (`packages/activemodel/src/forbidden-attributes-protection.ts`,
  `vendor/rails/v8.0.2/activemodel/lib/active_model/forbidden_attributes_protection.rb:23-30`)
  returns `attrs.toH()` typed `Record<string, unknown>`, and `_assignAttributes`
  (`packages/activemodel/src/attribute-assignment.ts`) walks it with
  `Object.entries` where Rails has `attributes.each`.
- `Base`'s constructor (`packages/activerecord/src/base.ts`) passes the
  sanitized value to `_extractAssociationAttrs`, which reads `Object.keys` and
  `attrs[k]`.
- `buildWhereClause`, `rewhere` and `createWithBang`
  (`packages/activerecord/src/relation/query-methods.ts`) and
  `constructRelationForExists` (`relation/finder-methods.ts`) sanitize and then
  branch on a plain object or spread it.
- `assignNestedAttributesForOneToOneAssociation` and
  `assignNestedAttributesForCollectionAssociation`
  (`packages/activerecord/src/nested-attributes.ts`) call `toH()` and then read
  `a["id"]`, `except(a, ...)` and `Object.keys`.
- `subclassFromAttributes` (`packages/activerecord/src/inheritance.ts`) already
  reads through `hashAref`; `authenticateBy`
  (`packages/activerecord/src/secure-password.ts`) reads `Object.entries`.
- `OID::Hstore#serialize`
  (`packages/activerecord/src/connection-adapters/postgresql/oid/hstore.ts`)
  calls `toUnsafeH()`.

ActiveRecord's own tests reach these paths through the `ProtectedParams` stub
(`packages/activerecord/src/support/stubs/strong-parameters.ts`), whose `toH`
answers a plain object, so nothing there reds when the real `Parameters`
changes.

## Acceptance criteria

- Each reader above reads its hash through a call that answers a plain object
  and a `Hash` alike (ruby-compat `eachPair`, `hashAref`, `hashKeys`), nested
  values included, with no conversion helper added.
- `ProtectedParams#toH` answers a `HashWithIndifferentAccess`, as Rails'
  `test/cases/forbidden_attributes_protection_test.rb` stub does, so the AR
  suites exercise the `Hash` arm.
- The touched ActiveModel and ActiveRecord suites stay green on all three
  adapters.
