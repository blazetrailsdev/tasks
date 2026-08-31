---
title: "row-write-patterns-miss-bang-writers"
status: draft
updated: 2026-08-31
rfc: "0119-connection-adapter-fidelity"
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

# Row-write ratchet's WRITE_PATTERNS misses every bang writer

## Context

Surfaced in PR #7280 (RFC 0119, sharding tests converted to the model API).

`WRITE_PATTERNS` (`scripts/non-transactional-row-writes.ts:91`) is

```ts
export const WRITE_PATTERNS = [".create(", ".insert", ".update(", "INSERT INTO", ".save()"];
```

Every entry is the non-bang spelling. trails' bang writers — `createBang(`,
`updateBang(`, `saveBang(`, `createOrFindByBang(`, `firstOrCreateBang(` — are
the Rails `create!` / `update!` / `save!` ports and write exactly the same rows,
but none of them matches: `.createBang(` does not contain `.create(`.

That made a file silently leave the offender set in #7280. Its two sharding
tests dropped their raw `INSERT INTO` strings in favour of
`ShardConnectionTestModel.createBang(...)` (Rails' `create!`,
`connection_handlers_sharding_db_test.rb:369,384,397,404`), so
`rowWritesAtItScope` went from "one write" to `[]` and the file's seeded row in
`scripts/non-transactional-row-writes.json` went stale, forcing its removal to
keep the only-shrink gate green. The rows are still written non-transactionally
across two `:memory:` shard databases; the analyzer just cannot see them.

The blast radius is not one file: any AR test file whose only row writes are
bang writers is currently invisible to this ratchet, and converting a test from
`create` to `createBang` silently retires its row.

## Acceptance criteria

- [ ] `WRITE_PATTERNS` matches the bang writers as well as the non-bang ones,
      by whatever spelling keeps `rowWritesAtItScope`'s receiver extraction
      working (a `Bang`-suffix-aware pattern, not five more literals, if that is
      cleaner).
- [ ] The new offenders that surfacing them reveals are seeded into
      `scripts/non-transactional-row-writes.json` in one reviewed pass — this is
      the one sanctioned widening, since the rows describe pre-existing files,
      not new work.
- [ ] `connection-handlers-sharding-db.test.ts` is back in the ratchet, since
      its `createBang` writes are exactly the shape the guard exists to catch.
- [ ] A unit test in `scripts/non-transactional-row-writes.test.ts` pins a bang
      writer as a detected write, so the gap cannot reopen.
