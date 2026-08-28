---
title: "indexParts emits a bare column where Rails always inspects the array"
status: ready
updated: 2026-08-28
rfc: "0051-migration-schema-statements-fidelity"
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

Rails' `index_parts` opens with `index.columns.inspect`
(`vendor/rails/activerecord/lib/active_record/schema_dumper.rb:265-268`), so a
single-column index always dumps as an array: `t.index ["code"], name: ...`.
Rails' own assertions depend on that spelling — `primary_keys_test.rb` asserts
`assert_no_match %r{t\.index \["code"\]}`.

trails' `indexParts` (`packages/activerecord/src/schema-dumper.ts:1097-1107`)
carries a single-column shorthand instead:

```ts
const cols =
  typeof index.columns === "string"
    ? JSON.stringify(index.columns)
    : index.columns.length === 1
      ? JSON.stringify(index.columns[0]) // <- the deviation
      : `[${index.columns.map((c) => JSON.stringify(c)).join(", ")}]`;
```

so a one-column index dumps as `t.index("firm_id", { … })` where Rails writes
`t.index ["firm_id"], …`. Surfaced while landing PR #7130
(`schema-dumper-in-create-emitters-write-after-the-block`), which moved the
emission point into the `create_table` block and made the emitted line the
literal Rails shape everywhere else.

The expression-index arm (a raw string, dumped verbatim) is correct and stays —
Rails reaches the same place because `index.columns` is a String there and
`String#inspect` quotes it.

## Converged shape

Drop the `length === 1` arm so an array of columns always dumps as an array,
mirroring `index.columns.inspect`. `TableDefinition#index` already accepts both
spellings, so the dump keeps round-tripping.

## Acceptance criteria

- [ ] `indexParts` emits `["col"]` for a single-column index, matching
      `schema_dumper.rb:266`.
- [ ] Assertions that pinned the shorthand move with it — including
      `primary-keys.test.ts`'s negative `t.index(["code"]` match, which then
      mirrors Rails' `assert_no_match` verbatim.
- [ ] Dumps still round-trip on SQLite, PostgreSQL and MySQL.
