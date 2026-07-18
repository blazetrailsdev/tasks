---
title: "Generate awaitable set#{Name} accessor for has_one (incl. through)"
status: in-progress
updated: 2026-07-18
rfc: "0068-awaitable-has-one-setter"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 10
pr: 4938
claim: "2026-07-18T18:41:15Z"
assignee: "awaitable-set-accessor-sugar"
blocked-by: null
---

## Context

The Rails-faithful immediate-persist path for a has_one replacement already
exists: `association(name).writer(x)` →
`HasOneAssociation#writeImmediate/persistImmediate`
(`packages/activerecord/src/associations/has-one-association.ts:118-187`),
mirroring `HasOneAssociation#replace`
(`vendor/rails/activerecord/lib/active_record/associations/has_one_association.rb:59-84`).
The through override (`has-one-through-association.ts:115-119`) routes the
same call through `persistReplace`. But reaching it requires the verbose
`await owner.association("account").writer(x)` incantation, so tests and app
code keep using the racy native `=` setter (see this RFC's Motivation).

This story adds the ergonomic surface this RFC sanctions: a generated
`set#{Name}` async accessor (e.g. `await firm.setAccount(x)`), defined
alongside the existing `build#{Name}` / `create#{Name}` accessors in
`packages/activerecord/src/associations/builder/has-one.ts:76-93`, as a THIN
delegation to `this.association(name).writer(value)` — no new semantics, no
logic in the wrapper. Works identically for has_one_through (the
association-level `writer` override handles the difference).

## Acceptance criteria

- [ ] `await owner.set#{Name}(record)` and `await owner.set#{Name}(null)`
      exist for every `has_one` / `has_one :through` declaration and delegate
      to `association(name).writer(value)` with no added logic.
- [ ] Returns the `writer` promise (so `RecordNotSaved` from a failed
      replacement rejects at the call site).
- [ ] Tests cover: persisted owner replace (displaced row nullified/destroyed
      per `:dependent`, inline — not at owner save), nil assignment, through
      replace, and failure propagation.
- [ ] No change to the native `=` setter in this story.

## Verification

`pnpm vitest run packages/activerecord/src/associations/has-one-associations.test.ts packages/activerecord/src/associations/has-one-through-associations.test.ts`

## Notes

Do not invent collection analogues — collections keep the Rails-named
awaitable methods (`replace`, `concat`, `destroy`).
