---
title: "Thread `returning` through `_insert_record`"
status: draft
updated: 2026-06-09
rfc: "0000-api-compare-arity-divergences"
cluster: api-compare-arity-divergences
deps: []
deps-rfc: []
est-loc: 250
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The flagship genuine arity divergence from this RFC's triage. Rails'
`ActiveRecord::Persistence::ClassMethods#_insert_record`
(`vendor/rails/activerecord/lib/active_record/persistence.rb:238`) is:

```ruby
def _insert_record(connection, values, returning)
  primary_key = self.primary_key
  primary_key_value = nil
  if prefetch_primary_key? && primary_key
    values[primary_key] ||= begin
      primary_key_value = next_sequence_value
      _default_attributes[primary_key].with_cast_value(primary_key_value)
    end
  end
  im = Arel::InsertManager.new(arel_table)
  if values.empty?
    im.insert(connection.empty_insert_statement_value(primary_key))
  else
    im.insert(values.transform_keys { |name| arel_table[name] })
  end
  connection.insert(im, "#{self} Create", primary_key || false,
                    primary_key_value, returning: returning)
end
```

The TS port (`packages/activerecord/src/persistence.ts:208`) drops the
`returning` parameter entirely, along with the `name`, `primary_key`,
`primary_key_value` args to `connection.insert` and the `prefetch_primary_key?`
branch. It calls `connection.insert(im)` with no returning path. The paired
helper `_returning_columns_for_insert(connection)` (the caller at
`persistence.rb:924`) is ported as `_returningColumnsForInsert()` and also drops
its `connection` argument.

`returning` is how Rails fetches DB-generated columns on INSERT (PostgreSQL
`RETURNING`; the generated id / DB-computed defaults elsewhere). Dropping it is a
real feature gap, not a port convention.

## Acceptance criteria

- [ ] `_insertRecord` accepts a `returning` parameter and threads it to the
      adapter `insert` call, matching Rails' arg order
      (`im, name, primary_key, primary_key_value, returning:`).
- [ ] `_returningColumnsForInsert` accepts its `connection` argument and returns
      the correct returning-columns set, mirroring Rails.
- [ ] The `prefetch_primary_key?` path and the empty-values
      `empty_insert_statement_value(primary_key)` branch are ported (or, if
      genuinely N/A for the current adapters, the omission is justified in the PR
      body with a Rails-source pointer — not silently dropped).
- [ ] Caller at the port's equivalent of `persistence.rb:924`
      (`_create_record`) computes `returning` columns first and passes them in.
- [ ] A test mirrors Rails' INSERT-returning behavior test-for-test (do not
      invent a new test name; read the corresponding Rails test first).
- [ ] `pnpm api:compare --arity` shows `_insert_record` and
      `_returning_columns_for_insert` no longer flagged; no new mismatches
      introduced. (Advisory — record the delta in the PR body.)
- [ ] `test:compare` green; touched activerecord suites green.

## Notes

- Rails source: `vendor/rails/activerecord/lib/active_record/persistence.rb:238`
  (`_insert_record`), `:924` (caller `_create_record`),
  `_returning_columns_for_insert` (same file — grep it).
- **Open question (RFC §Open questions 1):** confirm whether the adapter `insert`
  already supports a returning path that `_insertRecord` simply never wired, or
  whether the adapter layer needs plumbing too. If the adapter work is larger than
  this PR's ≤500 LOC budget, **do not expand this story** — register the adapter
  piece as a new story (`pnpm tasks new api-compare-arity-divergences <slug>`) and
  land the `_insertRecord` threading against the existing adapter surface here.
- This touches the hot persistence path; the existing INSERT test surface gives
  high confidence the change is behavior-preserving where returning is unused.
