---
title: "An aref receiver is kind `expr`, so a converged String#delete call still flags"
status: blocked
updated: 2026-09-08
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: "2026-09-08T19:00:34Z"
assignee: "aref-receiver-kind-blocks-string-delete-credit"
blocked-by: 'Premise falsified against vendor/rails. (1) The story''s primary shape — resolve an aref whose base is a proven Hash-shaped local — cannot fire on its own instance: in unique_constraints (activerecord/lib/active_record/connection_adapters/postgresql/schema_statements.rb:711) `row` is the block parameter of `unique_info.map do |row|`, and hash_typed_locals (extract-ruby-api.rb:2637-2661) proves only `**opts` / hash-literal-default params and locals whose every assignment is a hash literal — never a block param. (2) The fallback shape — a narrower aref kind — cannot satisfy AC3. railties/lib/rails/generators/rails/db/system/change/change_generator.rb:141 is `compose_config["services"]["rails-app"].delete("depends_on")`: an aref receiver with a string-literal argument, Ripper-identical to `row["conkey"].delete("{}")`, and it is Hash#delete. Four more aref-receiver delete sites in vendored lib (test_fixtures.rb:309, pool_manager.rb:41, notifications/fanout.rb:91, subscriber_map.rb:29) are Hash/Array#delete. So any aref-keyed admission of String#delete wrongly credits them, violating ''the 17 Hash#delete / Response#delete_header sites must stay uncredited''. Unblocking needs a receiver-class proof Ripper does not have; re-scope to a different receipt shape (e.g. a call-site tag) or close.'
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
