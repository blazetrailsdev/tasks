---
title: "Emit MySQL 8 expression-index schema dump syntax and converge gate"
status: draft
updated: 2026-07-05
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Follow-up to `gate-wrong-gate-body-convergence` (RFC 0032). KNOWN impl gap.
`schema-dumper.test.ts` "schema dump expression indices escaping" is `wrong-gate`:
rails `adapters=[mysql] features=[expression_index]` / ts
`adapters=[postgresql,sqlite]`. The `expression_index` feature in
`test-helpers/supports.ts` deliberately EXCLUDES mysql because trails' schema-dump
DDL generator does not yet emit MySQL 8 expression-index syntax (the P-9 family).

This requires an impl fix: emit correct MySQL 8 `((expr))` expression-index
syntax in the schema dumper, then unlock `mysql` in the `expression_index`
supports key and converge the test's gate.

Rails: postgresql_adapter.rb:208 / abstract_mysql_adapter.rb:104; schema-dump
expression-index coverage in schema_dumper tests.

## Acceptance criteria

- [ ] Emit MySQL 8 expression-index DDL in the schema dumper (P-9 family).
- [ ] Add `mysql` to `expression_index` in supports.ts.
- [ ] Gate "schema dump expression indices escaping" so the extracted gate
      matches rails (`mysql|expression_index` / feature gate as appropriate);
      `test:compare --gates` reports no wrong-gate for it.
- [ ] Verify on the mysql lane. Test name unchanged.
