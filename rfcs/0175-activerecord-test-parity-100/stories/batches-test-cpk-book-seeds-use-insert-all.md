---
title: "activerecord: batches.test.ts seeds Cpk::Book with insert_all! as Rails does"
status: draft
updated: 2026-10-01
rfc: "0175-activerecord-test-parity-100"
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

Four `EachTest` cases in `packages/activerecord/src/batches.test.ts` seed `cpk_books` with three
`await CpkBook.create({ id: [a, b] })` calls each (`:1266-1268`, `:1280-1282`, `:1298-1300`, `:1316-1318`).
Rails seeds them with one bulk insert:

```ruby
Cpk::Book.insert_all!([
  { author_id: 1, id: 1 },
  { author_id: 2, id: 1 },
  { author_id: 2, id: 2 }
])
```

at `vendor/rails/v8.0.2/activerecord/test/cases/batches_test.rb:1026`, `:1042`, `:1053`, `:1064`
(tests `.find_each with multiple column ordering and using composite primary key`,
`.in_batches should start from the start option when using composite primary key with multiple column ordering`,
`.in_batches should end at the finish option when using composite primary key with multiple column ordering`,
`.in_batches with scope and multiple column ordering and using composite primary key`).

`create` runs validations and callbacks and issues three INSERTs; `insert_all!` issues one and runs neither.
Found while trimming the file's fixture declaration in trails#8326; the surrounding bodies also carry
`(b: any)` / `as any` casts that the Rails text has no counterpart for.

## Acceptance criteria

- [ ] Each of the four tests seeds with `CpkBook.insertAllBang([{ author_id, id }, ...])`, same rows and order as Rails.
- [ ] The rest of each body reads line-for-line against `batches_test.rb:1025-1073`; test names unchanged.
- [ ] `pnpm parity:test:assertions` stays green.
