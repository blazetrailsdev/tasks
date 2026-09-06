---
title: "Row-write ratchet's non-bang patterns miss createOrFindBy / firstOrCreate"
status: draft
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while shipping `row-write-patterns-miss-bang-writers` (PR #7567), which
made `WRITE_PATTERNS` (`scripts/non-transactional-row-writes.ts`) bang-aware by
deriving `.${name}Bang(` for each of `BANG_WRITERS` = `create`, `update`,
`save`, `createOrFindBy`, `firstOrCreate`.

Two of those five — `createOrFindBy` and `firstOrCreate` — have NO non-bang
entry in `NON_BANG_WRITE_PATTERNS`, which is still

```ts
const NON_BANG_WRITE_PATTERNS = [".create(", ".insert", ".update(", "INSERT INTO", ".save()"];
```

`.create(` does not prefix `.createOrFindBy(`, and nothing prefixes
`.firstOrCreate(`. So the ratchet now sees `Book.createOrFindByBang(...)` but
not `Book.createOrFindBy(...)`, even though both write the same row. Rails
defines the pair together — `create_or_find_by` /
`create_or_find_by!` at `vendor/rails/activerecord/lib/active_record/relation.rb:249,264`
and `first_or_create` / `first_or_create!` at
`vendor/rails/activerecord/lib/active_record/relation.rb:174,182` — so the
asymmetry is an artifact of how the seed list was written, not of Rails.

Same class of hole the merged story fixed: an AR test file whose only row
writes are `firstOrCreate(` / `createOrFindBy(` is invisible to the guard, and
converting a test from `createOrFindByBang` to `createOrFindBy` silently
retires its ratchet row.

## Acceptance criteria

- [ ] `NON_BANG_WRITE_PATTERNS` covers `.createOrFindBy(` and `.firstOrCreate(`
      (or the list is restructured so a writer name yields both spellings from
      one entry, which is the shape `BANG_WRITERS` already implies).
- [ ] Any offenders this surfaces are seeded into
      `scripts/non-transactional-row-writes.json` in one reviewed pass — the
      rows describe pre-existing files, not new work.
- [ ] A unit test in `scripts/non-transactional-row-writes.test.ts` pins a
      non-bang `firstOrCreate(` / `createOrFindBy(` as a detected write.
