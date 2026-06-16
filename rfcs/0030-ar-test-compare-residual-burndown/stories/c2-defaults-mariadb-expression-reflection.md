---
title: "MariaDB uuid()/concat() expression-default reflection"
status: claimed
updated: 2026-06-16
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-06-16T01:40:53Z"
assignee: "c2-defaults-mariadb-expression-reflection"
blocked-by: null
---

## Context

Two `MysqlDefaultExpressionTest` tests in
`packages/activerecord/src/defaults.test.ts` remain `it.skip` after RFC 0030
story `c2-defaults-expression-dump` (the other 9 of the 11 are un-skipped and
green on the MariaDB CI lane):

- `schema dump includes default expression` (`defaults.uuid`, `defaults_test.rb:174`)
- `schema dump includes default expression with single quotes reflected correctly`
  (`defaults.char2_concatenated`, `defaults_test.rb:179`)

Both are gated `supports_default_expression?`; the `defaults` table columns are
built from `mysql2_specific_schema.rb:23-24`:
`t.binary :uuid, limit: 36, default: -> { "(uuid())" }` and
`t.string :char2_concatenated, default: -> { "(concat(\`char2\`, '-'))" }`.

On the MariaDB CI lane the schema dumper does not reflect these as _function_
defaults. Observed dump output:

```text
t.binary("uuid", { limit: 36, default: {"0":117,"1":117,"2":105,"3":100,"4":40,"5":41} });
t.string("char2_concatenated", { default: "concat(`char2`,'-')" });
```

i.e. the `uuid()` default is deserialized as a **literal binary value** (the bytes
of the string `"uuid()"`) and `concat(...)` as a **literal string default**, rather
than `default: () => "(uuid())"` / `default: () => "(concat(...))"`. So
`column.defaultFunction` is null for these columns on MariaDB.

The `CURRENT_TIMESTAMP` / `CURRENT_TIMESTAMP(N)` / `ON UPDATE` datetime+timestamp
function-default path (the other 7 tests) works. The gap is specifically in
`newColumnFromField` / `columnDefinitions`
(`connection-adapters/mysql/schema-statements.ts`) general function-default
detection for MariaDB's representation of arbitrary expression defaults
(`uuid()`, `concat()`) — MariaDB does not tag them with MySQL 8's
`DEFAULT_GENERATED` extra, so the detection branch that wraps them into
`defaultFunction` never fires.

## Acceptance criteria

- [ ] Detect MariaDB expression/function column defaults (e.g. `uuid()`,
      `concat(...)`) and populate `column.defaultFunction` so the schema dumper
      emits `default: () => "..."` — mirroring Rails'
      `MySQL::Column#extract_default` / `has_default_function?` on MariaDB.
- [ ] Un-skip both tests in `defaults.test.ts` and have them pass on the MariaDB
      CI lane (no `it.skip`).
- [ ] No deviation from Rails' assertions or the canonical `defaults` table shape.
