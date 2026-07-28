---
title: "port-postgresql-specific-schema-measurements-and-include-index"
status: ready
updated: 2026-07-28
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
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

## Context

Follow-up to `port-postgresql-specific-schema-remainder`, which ported the
plain `create_table` half of
`vendor/rails/activerecord/test/schema/postgresql_specific_schema.rb:50-225`
into `loadPostgresqlSpecificSchema`
(`packages/activerecord/src/support/load-schema-helper.ts`).

Still unported: lines 187-201 —

```ruby
if supports_partitioned_indexes?
  create_table(:measurements, id: false, force: true, options: "PARTITION BY LIST (city_id)") do |t|
    t.string :city_id, null: false
    t.date :logdate, null: false
    t.integer :peaktemp
    t.integer :unitsales
    t.index [:logdate, :city_id], unique: true
  end
  create_table(:measurements_toronto, id: false, force: true, options: "PARTITION OF measurements FOR VALUES IN (1)")
  create_table(:measurements_concepcion, id: false, force: true, options: "PARTITION OF measurements FOR VALUES IN (2)")
end

add_index(:companies, [:firm_id, :type], name: "company_include_index", include: [:name, :account_id])
```

`measurements` is laid inline today at
`packages/activerecord/src/insert-all.test.ts:1007-1086` via raw
`executeMutation` DDL (plus its own teardown drops) — repoint that suite at
the boot-laid tables in the same change.

## Acceptance criteria

- `loadPostgresqlSpecificSchema` lays `measurements`, `measurements_toronto`
  and `measurements_concepcion` under a `supportsPartitionedIndexes()` gate,
  and adds `company_include_index` on `companies`, matching Rails verbatim.
- The three `measurements*` tables are listed in `ADAPTER_SPECIFIC_TABLES`.
- `insert-all.test.ts` is repointed at the boot-laid `measurements` tables.
