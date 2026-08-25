---
title: "uuid_default's non-pgcrypto branch is unreachable on the matrix and untested"
status: done
updated: 2026-07-30
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 5673
claim: "2026-07-30T20:29:24Z"
assignee: "cover-non-pgcrypto-uuid-default-branch"
blocked-by: null
closed-reason: null
---

## Context

`support/load-schema-helper.ts` ports
`postgresql_specific_schema.rb:7`:

```ruby
uuid_default = supports_pgcrypto_uuid? ? {} : { default: "uuid_generate_v4()" }
```

splatting it into `chat_messages`, `uuid_parents` and `uuid_children` (lines 9,
18, 22). PR #5523 added the `else` half after review caught that the loader
gated the `pgcrypto` extension on the predicate but still created all three
tables on the adapter's implicit `gen_random_uuid()` PK default — naming a
function the non-pgcrypto branch has just declined to provide.

That `else` branch is now correct but **unreachable on our matrix**:
`supports_pgcrypto_uuid?` is PG >= 9.4 (`postgresql_adapter.rb:299`,
`support/supports.ts:109-111`) and CI runs pg17, so the ternary always yields
`{}`. Nothing exercises the fallback, and nothing would catch it rotting.

The reachable half of the same mechanism _is_ covered — `chat_messages_custom_pk`
uses Rails' bare-string `default: "uuid_generate_v4()"` on a uuid column
(`postgresql_specific_schema.rb:14`), and `persistence.test.ts`'s uuid-PK tests
would fail if `quoteDefaultExpression` quoted it as a literal instead of
emitting it bare. Only the predicate-false path is untested.

## Acceptance criteria

- The `supports_pgcrypto_uuid? == false` branch is exercised — e.g. build the
  `TableDefinition` with the predicate stubbed and assert the emitted DDL names
  `uuid_generate_v4()` on the PK, without laying tables on the shared per-worker
  database.
- Note in the test why the branch is otherwise dead, so a future reader does not
  delete it as unused.
