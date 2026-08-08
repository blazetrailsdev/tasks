---
title: "The no-setter arm raises MissingAttributeError where Rails calls attribute_writer_missing"
status: done
updated: 2026-08-08
rfc: "0087-awaitable-association-writers-only"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6216
claim: "2026-08-08T01:34:07Z"
assignee: "migration-connection-readers-name-lease-connection"
blocked-by: null
closed-reason: null
---

## Context

`assignAttributes` (`packages/activerecord/src/persistence.ts`) refuses the
association keys RFC 0087 §1 left without a `#{name}=` property setter by
calling `this.writeAttribute(key, value)`, which raises
`MissingAttributeError: can't write unknown attribute \`posts\``
(`packages/activemodel/src/attribute.ts:336`).

Rails' absent-setter path is different. `_assign_attribute`
(`vendor/rails/activemodel/lib/active_model/attribute_assignment.rb:67-75`)
rescues `NoMethodError`, checks `respond_to?(setter)`, and on a false answer
calls `attribute_writer_missing(k.to_s, v)` (:73) — whose default
(`attribute_assignment.rb:20`-ish, ported at
`packages/activemodel/src/model.ts:2488` / `attribute-assignment.ts:20`) raises
`UnknownAttributeError: unknown attribute 'posts' for Author.`
(`packages/activemodel/src/errors.ts:489`).

So trails raises the wrong error class with the wrong message on the one arm
that is meant to be standing in for "there is no setter here". Five tests
enshrine the current string (`/unknown attribute \`posts\`/`etc.) in`packages/activerecord/src/associations/`:
`collection-awaitable-writers.trails.test.ts`,
`has-one-persisted-setter-throws.trails.test.ts`,
`constructor-form-and-hmt-insert.test.ts` — those assert trails' deviation, not
Rails behaviour, so they move with the fix.

Note the same `writeAttribute` fallback is `_assignAttribute`'s own no-setter
arm, so this is likely one fix covering both sites.

## Converged shape

Route the no-setter arm through `attributeWriterMissing(key, value)`, matching
`attribute_assignment.rb:71-73`, so an absent setter raises
`UnknownAttributeError` with Rails' message. Coordinate with
`ar-assign-attribute-bypasses-attribute-writer-missing`, which touches the same
branch, and with [[retire-deferred-assignment-return-arm-on-assign-attribute]].

## Acceptance criteria

- [ ] `_assignAttribute`'s no-setter arm calls `attributeWriterMissing`
      (`attribute_assignment.rb:71-73`), not `writeAttribute`.
- [ ] `assignAttributes`' association refusal raises the same thing.
- [ ] The five enshrining assertions are updated to Rails'
      `UnknownAttributeError` message. No test RENAMES — assertion text only.
- [ ] `packages/activerecord/src/associations/`, nested-attributes and
      persistence suites green.
