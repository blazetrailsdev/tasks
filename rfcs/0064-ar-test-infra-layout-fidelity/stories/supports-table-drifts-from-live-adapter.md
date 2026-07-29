---
title: "supports.ts bakes static capability answers instead of asking the connection"
status: done
updated: 2026-07-29
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 5585
claim: "2026-07-29T18:22:16Z"
assignee: "supports-table-drifts-from-live-adapter"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/test/support/adapter_helper.rb:66-83` defines its
`supports_*?` set by delegating to the live connection:

```ruby
define_method(method_name) { ActiveRecord::Base.lease_connection.public_send(method_name) }
```

trails renders the same set as a static `SUPPORTS` table in
`packages/activerecord/src/support/supports.ts`, keyed by feature and resolved
off `adapterType` — i.e. it bakes in what each CI backend version answers rather
than asking the adapter. The file documents this deliberately, and it is why
`expression_index` already needs a live-server probe escape hatch (the mysql
lane is MySQL 8 locally but a MariaDB stand-in in CI, and the two disagree).

Every entry is a hand-maintained transcription of a `supports_*?` method body
plus a version comparison against an assumed server version. It drifts silently:
nothing fails when an adapter's real predicate and the table disagree, and PR 5398
found two adapter_helper predicates (`supports_non_unique_constraint_name?`,
`supports_sql_standard_drop_constraint?`) simply missing from the table, where a
ported Rails test would have thrown unknown-feature instead of gating.

## Acceptance criteria

- Decide and record whether the static table is load-bearing (collection-time
  gating needs a sync answer before `Base` connects) or whether the gates can
  move to a connection-backed lookup like Rails'.
- If it stays static: add a check that reconciles each `SUPPORTS` key against the
  live adapter's `supports_<key>?()` on the running lane, so drift fails loudly
  instead of silently mis-gating. The `expression_index` probe is the shape to
  generalize.
- If it can go live: delegate to the leased connection as `adapter_helper.rb:66-83`
  does, keeping `describeIfSupports` / `itIfSupports` call sites unchanged.
- Either way, no test is renamed and the test:compare gate keys stay identical.
