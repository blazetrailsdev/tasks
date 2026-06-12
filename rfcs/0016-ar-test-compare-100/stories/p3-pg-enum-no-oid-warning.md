---
title: "p3-pg-enum-no-oid-warning"
status: draft
updated: 2026-06-12
rfc: "0016-ar-test-compare-100"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Split off from `p3-pg-enum-orm-and-schema` (PR #3160). That story un-skipped 4
of the 5 hard `it.skip` entries in
`packages/activerecord/src/adapters/postgresql/enum.test.ts`; the one remaining
skip is `no oid warning`, which mirrors Rails `test_no_oid_warning`:

```ruby
def test_no_oid_warning
  @connection.execute "INSERT INTO postgresql_enums VALUES (1, 'sad');"
  stderr_output = capture(:stderr) { PostgresqlEnum.first }
  assert_predicate stderr_output, :blank?
end
```

Blocked on infra: there is no vitest equivalent of Ruby `capture(:stderr)`, and
the PG adapter has no stderr/warn sink to assert against (repo rules forbid
`process.*`). Landing this needs a console/stderr hook helper plus adapter warn
plumbing so the test can assert "no unknown-OID warning was emitted" when a
known enum type is reflected.

The skip is documented in `enum.test.ts` pointing at this story.

## Acceptance criteria

- [ ] A test-only stderr/console capture helper exists (no `process.*`).
- [ ] The PG type-map / OID reflection path routes any "unknown OID" warning
      through a capturable sink.
- [ ] `no oid warning` in `enum.test.ts` un-skipped and passing.
- [ ] No regression in the existing enum tests.
