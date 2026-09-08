---
title: "aref-receiver-kind-blocks-string-delete-credit"
status: draft
updated: 2026-09-08
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
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

`RECEIVER_KEYED_RUBY_COMPAT_EXPORTS` (`scripts/parity/ruby-compat.ts`) credits a
ruby-compat export only where the Ruby extractor proved the receiver's class.
An **aref receiver** — `row["conkey"].delete("{}")` — is recorded as kind
`expr`, which proves nothing, so a body that DOES call the port is still
flagged as omitting the Rails call.

Concrete instance, shipped in PR #7611:
`unique_constraints`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/schema_statements.rb:709`)
is `row["conkey"].delete("{}").split(",").map(&:to_i)`. The port
(`packages/activerecord/src/connection-adapters/postgresql/schema-statements.ts`)
now calls the real `String#delete` port, `stringDelete(String(r.conkey), "{}")`,
and `["String#delete", { tsExport: "stringDelete", receiver: "string" }]` is in
the receiver-keyed table — but the call still flags, so
`scripts/api-compare/call-mismatches-exclude/activerecord/connection-adapters/postgresql/schema-statements.json`
had to keep a row whose `reason` says the code is converged and only the
comparator cannot see it. That is a baseline row measuring a tooling gap, not a
deviation, and it is the file's last row.

The unconditional-table escape hatch does not apply: the bare name `delete` is
also `Hash#delete` and `Rack::Response#delete_header`, and a row in
`RUBY_COMPAT_EXPORTS` flagged 17 of those sites as hand-rolled primitives.

Follows `ruby-extractor-record-call-receiver-kind` (#5726), which landed the
receiver kinds in the first place.

## Converged shape

Teach the Ruby extractor's `receiver_kind` to resolve an aref whose base is a
proven Hash-shaped local — a `row[...]` read off a query result is a String in
every one of these bodies — or add the narrower kind the comparator needs to
distinguish "aref on a hash of strings" from a bare `expr`. Then delete the
baseline row and tighten the shard; the file reaches 0 rows, which is what
`pg-unique-constraints-string-delete-has-no-ruby-compat-analogue` originally
asked for.

## Acceptance criteria

- [ ] `unique_constraints`' `delete` call credits `stringDelete` with no
      baseline row.
- [ ] `scripts/api-compare/call-mismatches-exclude/activerecord/connection-adapters/postgresql/schema-statements.json`
      is deleted (0 rows) and the mark tightened.
- [ ] No new rows appear elsewhere: the 17 `Hash#delete` /
      `Response#delete_header` sites must stay uncredited.
