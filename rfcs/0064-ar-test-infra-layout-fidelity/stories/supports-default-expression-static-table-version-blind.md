---
title: "supports.ts default_expression is version-blind; Rails gates on MySQL >= 8.0.13 / MariaDB >= 10.2.1"
status: done
updated: 2026-08-09
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5585
claim: "2026-08-09T19:47:17Z"
assignee: "supports-default-expression-static-table-version-blind"
blocked-by: null
closed-reason: null
---

## Context

`support/supports.ts` renders `supports_default_expression?` as a static
adapter table — `default_expression: ["postgres", "mysql"]` (supports.ts:150-153).
Rails' predicate is version-sensitive, not adapter-sensitive
(`vendor/rails/activerecord/test/support/adapter_helper.rb:23-30`):

```ruby
def supports_default_expression?
  if current_adapter?(:PostgreSQLAdapter)
    true
  elsif current_adapter?(:Mysql2Adapter, :TrilogyAdapter)
    conn = ActiveRecord::Base.lease_connection
    (conn.mariadb? && conn.database_version >= "10.2.1") ||
      (!conn.mariadb? && conn.database_version >= "8.0.13")
  end
end
```

So `adapterSupports("default_expression")` answers `true` for every
MySQL-family lane, including a MariaDB CI stand-in below 10.2.1 or a MySQL
below 8.0.13, where Rails would skip. The comment on the entry acknowledges
this ("MySQL true for mysql:8") — it bakes in an assumption about which server
the mysql lane runs, which the MariaDB stand-in violates.

The faithful predicate already exists and is live-connection derived:
`supportsDefaultExpression` in `support/mysql-server-version.ts:64-66`.

Surfaced while porting `test_change_column_null_does_not_change_default_functions`
in PR #5569 (`migration/columns.test.ts`). That call site was fixed in review by
ANDing the live predicate onto the gate, but the two other consumers were left
alone:

- `defaults.test.ts:298` — `itIfSupports("default_expression", "schema dump includes default expression")`
- `defaults.test.ts:309` — second `itIfSupports("default_expression", ...)`

Note the constraint that forced the belt-and-braces gate in #5569: the
`parity:test` TS gate extractor only recognizes `adapterSupports("<feature>")`
as a feature term (`scripts/test-compare/gates.ts:184`). Dropping that token in
favor of the live predicate alone collapses the extracted gate to
`guards: ["unknown"]` and produces a wrong-gate mismatch against Ruby's
`features: ["default_expression"]`. Any fix must keep the extractor seeing a
feature token.

## Acceptance criteria

- [ ] `default_expression` resolves through the live MySQL/MariaDB version
      predicate rather than a static adapter list, so a sub-10.2.1 MariaDB or
      sub-8.0.13 MySQL lane skips exactly as Rails does.
- [ ] The two `defaults.test.ts` call sites are covered by the corrected
      answer (no separate hand-ANDed guard needed at each site).
- [ ] `parity:test` gate extraction is unchanged: 0 gate-mismatch for
      `defaults_test.rb` and `migration/columns_test.rb`.
- [ ] Audit whether sibling version-sensitive entries in the same table
      (e.g. `optimizer_hints`, `expression_index`, which already have live
      predicates in `mysql-server-version.ts`) have the same static-table hole,
      and note findings.
- [ ] Green on all three lanes.
