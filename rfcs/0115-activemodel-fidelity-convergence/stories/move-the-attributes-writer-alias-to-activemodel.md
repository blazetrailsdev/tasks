---
title: "Move the attributes= alias to ActiveModel, next to assign_attributes"
status: ready
updated: 2026-08-21
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`alias attributes= assign_attributes` is one line in ActiveModel
(`vendor/rails/activemodel/lib/active_model/attribute_assignment.rb:36`),
immediately under the method it aliases. ActiveRecord does not restate it.

trails puts the alias in ActiveRecord: `setAttributes` in
`packages/activerecord/src/persistence.ts` (wired onto `Base` in `base.ts`),
plus the `attributes` property setter defined on `Base.prototype` in `base.ts`
that parks the returned promise. #6791 collapsed `assign_attributes` itself onto
the single ActiveModel port, so the alias is now the only half still living in
the wrong package — and it lives in `persistence.ts`, whose Rails counterpart
has neither the alias nor the method.

The reason it is a `setX()` method at all is the settled trails idiom: a TS
`set` accessor cannot be awaited, and the aliased write path can owe I/O
(`replace`, collection_association.rb:46-48; `ids_writer`, :61-83; has_one's
displacing writer, has_one_association.rb:59-84). That part is language-forced
and stays; only its home is wrong.

## Converged shape

`setAttributes` sits in `packages/activemodel/src/attribute-assignment.ts` next
to `assignAttributes` (the Rails layout), exposed on `Model` like the rest of
that module's surface, and ActiveRecord inherits it. The `attributes` property
setter on `Base.prototype` keeps parking the promise — that is the sync half of
the same alias — but delegates to the inherited method.

## Acceptance criteria

- `setAttributes` is defined once, in `activemodel/src/attribute-assignment.ts`,
  and `persistence.ts` no longer defines or exports it (nor does `base.ts` wire
  it).
- `pnpm parity:api:extra --package activemodel` keeps `attribute-assignment.ts`
  at 0 novel — `attributes=` maps to `setAttributes` through
  docs/ruby-ts-conventions.md, so it should score as a real Rails name.
- `forbidden-attributes-protection*.test.ts`, `persistence.test.ts` and the
  nested-attribute suites stay green.
