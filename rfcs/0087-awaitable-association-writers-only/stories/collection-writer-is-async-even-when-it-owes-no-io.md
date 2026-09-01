---
title: "Collection writer is unconditionally async even when the replace owes no I/O"
status: ready
updated: 2026-09-01
rfc: "0087-awaitable-association-writers-only"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`CollectionAssociation#writer` is unconditionally `async`
(`packages/activerecord/src/associations/collection-association.ts:58`), so it
answers a promise even when the replace it performs does no database work.

Surfaced by PR #7303: on the synchronous assignment surface,

```ts
const fresh = new Firm({ name: "fresh" });
fresh.assignAttributes({ clients: [] });
```

now raises, because the writer returns a promise. But the owner is a **new
record** and the target is empty, so Rails does no I/O here at all — the same
observation the parent story made for has_one:

- `has_one_association.rb:66` — `replace` does `save &&= owner.persisted?`, so
  the save is a no-op for an unpersisted owner.
- `association.rb#find_target?` is false for a new record, so `load_target`
  never queries.
- `collection_association.rb#replace` (`:46-48`) delegates to
  `replace_records` / `concat_records`; with no existing target loaded and no
  new records, neither issues a statement.

The test `collection-proxy-replace-diff.trails.test.ts` >
"refuses a mass-assigned replace that owes the database" was moved onto
`setAttributes` in #7303 to accommodate this. That is the accommodation, not
the fix: the assertion it originally made — that a _new_ owner's empty replace
does **not** raise on the sync surface — is the Rails-correct one.

## Converged shape

Make the collection writer answer synchronously when it owes no I/O, mirroring
`has_one_association.rb:66`'s `save &&= owner.persisted?` guard: a non-`async`
body returning `Promise<void> | void` (the settled trails shape — see
`assignNestedAttributesFor*`), answering a promise only when a statement is
actually owed.

Then restore the test to
`expect(() => fresh.assignAttributes({ clients: [] })).not.toThrow()`.

## Acceptance criteria

- [ ] `new Firm({ name: "fresh" })` followed by
      `assignAttributes({ clients: [] })` completes synchronously and does not
      raise.
- [ ] A replace that DOES owe the database still raises on the sync surface and
      resolves on `setAttributes`.
- [ ] `collection-proxy-replace-diff.trails.test.ts` restored to the
      `assignAttributes` / `not.toThrow` assertion.
- [ ] `packages/activerecord/src/associations/` green on all three lanes.
