---
title: "burndown-annotate-verified-equivalents"
status: done
updated: 2026-08-11
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6372
claim: "2026-08-11T18:05:53Z"
assignee: "burndown-annotate-verified-equivalents"
blocked-by: null
closed-reason: null
---

## Context

Second slice of `burndown-annotate-permanent-deviations` (PR #6364 shipped the
first: the two JSONGemEncoder rows and the whole Mutex#synchronize cluster, 22
rows, and retired the dead `call-mismatches-wide-exclude/` tree).

What is left is the **verified-equivalents group**: the rows in
`scripts/api-compare/call-mismatches-exclude/` that already carry real
per-entry prose but are NOT the synchronize cluster. Densest files:

- `activerecord/connection-adapters/postgresql-adapter.json` — ~15 curated
  rows: RFC 0072 `values_at` verification on enable/disable_extension, the
  `Proc.new` → arrow-function rows on change_column\*\_for_alter
  (postgresql/schema_statements.rb:1054,1062), the `quote_string`
  with_raw_connection language shortcoming (postgresql/quoting.rb:127).
- `activerecord/attribute-methods.json` — the RFC 0032 wide-entry-verified
  `include` and `owner` rows (attribute_methods.rb:42-50, :187-197).
- `activerecord/connection-adapters/abstract-adapter.json` — the bucket-(b)
  `disable_prepared_statements` row (abstract_adapter.rb:159).

`pnpm parity:api:build --package <pkg> --file <f> --call <ruby_call>` (the
`--call` filter landed in #6364) migrates one cluster at a time, so a file can
be drained without dragging its tracked-debt rows along.

## Acceptance criteria

- Audit EVERY row before tagging (RFC 0080
  `audit-existing-tags-for-convergeable-surface` test): a row whose prose
  describes a real gap — e.g. connection-pool's `pin_connection! / checkout`
  row, or attribute-methods' `readonly_attribute?` row, both deliberately left
  baselined by #6364 — is convergeable work and must NOT be tagged. Converge it
  or leave it baselined for its own story.
- Migration runs through `parity:api:build`, never by hand-editing both sides.
- No `DEFAULT_REASON` seed prose is migrated (the tool already refuses).
- `parity:api:calls` row count strictly shrinks; `parity:api:reasons` and
  `parity:api:detached` stay green.
- Check for an existing owner before claiming a file: if an open story in
  another RFC owns it, the row belongs there as an acceptance criterion.
