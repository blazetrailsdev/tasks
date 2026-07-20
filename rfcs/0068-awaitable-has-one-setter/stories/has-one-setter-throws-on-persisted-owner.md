---
title: "has_one native = setter: in-memory for new owners, throws for persisted"
status: done
updated: 2026-07-20
rfc: "0068-awaitable-has-one-setter"
cluster: null
deps: ["awaitable-set-accessor-sugar"]
deps-rfc: []
est-loc: 300
priority: 11
pr: 4949
claim: "2026-07-19T01:31:12Z"
assignee: "has-one-setter-throws-on-persisted-owner"
blocked-by: null
---

## Context

The native `=` setter (`packages/activerecord/src/associations/builder/has-one.ts:113`,
`defineWriters` → `set` → `queueWrite`) and the mass-assignment hasOne arm
(`packages/activerecord/src/attribute-assignment.ts:186-193`) currently defer
all DB work of a persisted-owner assignment to the owner's next `save()` via
`HasOneAssociation#queueWrite`
(`packages/activerecord/src/associations/has-one-association.ts:70-107`).
Rails does the displacement + persistence inline at assignment
(`has_one_association.rb:59-84`); the deferral window is the root cause of
the #4899/#4901/#4908/#4910 two-row races (see this RFC's Motivation).

This story flips the setter's persisted-owner arm to a THROW:

- Unpersisted owner: keep the in-memory replace (Rails does no I/O there
  either — `save &&= owner.persisted?` at `:66` gates the transaction and
  the record save; autosave persists at the owner's first save).
- Persisted owner: throw a clear error naming the replacement:
  `await owner.set#{Name}(x)` / `association(name).writer(x)`. Same throw
  from the mass-assignment arm (`assignAttributes` / `update` with a hasOne
  key on a persisted owner).

In-repo callers (tests and any product code assigning has_one on persisted
owners) must be migrated to `await owner.set#{Name}(x)` in this same story —
the throw cannot land red. NEVER rename tests while migrating; the through
`queueWrite` override (`has-one-through-association.ts:104-106`) inherits the
same dispatch and is in scope for the setter behavior (its machinery removal
is a later story).

## Acceptance criteria

- [ ] `owner.child = x` on an unpersisted owner still does the in-memory
      replace (FK + inverse set, persisted by autosave at first save) — with
      no displacement queueing side effects for persisted-displaced records
      beyond what an unpersisted owner can have.
- [ ] `owner.child = x` (and `assignAttributes({ child: x })` / `update`) on
      a persisted owner throws an error whose message names the association
      and the `await owner.set#{Name}(x)` replacement.
- [ ] Same behavior for has_one_through assignment.
- [ ] All in-repo persisted-owner assignment sites migrated to the awaitable
      surface; no test renames.
- [ ] The RFC's ergonomic-tradeoff decision is referenced in the error path's
      JSDoc (non-obvious context: why we deviate loudly from Rails' legal
      syntax).

## Definition of done

Routing the persisted-owner arm to a floating `writer(...)` promise does NOT
close this story — the throw is the design.

## Verification

`pnpm vitest run packages/activerecord/src/associations/has-one-associations.test.ts packages/activerecord/src/attribute-methods.test.ts`
