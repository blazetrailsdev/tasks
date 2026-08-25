---
title: "call-args-schema-definitions-add-to-foreign-key"
status: done
updated: 2026-08-13
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6488
claim: "2026-08-13T19:05:38Z"
assignee: "call-args-schema-definitions-add-to-foreign-key"
blocked-by: null
closed-reason: null
---

## Context

Split out of `call-args-ar-connection-adapters-blocks` (PR pending), which
converged the other four rows in that story (`with_connection` → `checkout`,
`create_column_definition` → `assert_valid_keys`, `handle_warnings` → `call`,
`establish_connection` → `call`) and left this one.

The row is
`connection-adapters/abstract/schema-definitions.ts` `add_to` → `foreign_key`,
`rubyArgs: []` vs `tsArgs: ["ref:foreignTableName", "ref:foreignKeyOptions"]`.

Reading `schema_definitions.rb:236-244`, `add_to` makes TWO `foreign_key`
references:

```ruby
if foreign_key                                              # :241 — attr_reader read, 0 args
  table.foreign_key(foreign_table_name, **foreign_key_options)  # :242 — 2 args
end
```

Ruby's `attr_reader :foreign_key` (`:248`) makes the guard a zero-arg CALL, so
the extractor has two Ruby sites named `foreign_key`. trails ports the reader as
a field, so `this.foreignKey` in the guard is a property READ, not a call, and
the TS side has exactly one `foreignKey` site — the real one at `:842`, which
already passes what Rails passes. The comparator pairs the port's single site
against Ruby's zero-arg guard read and reports a shape divergence that is not
one. `relation/query-methods.ts` `build_with_join_node` → `foreign_key` looks
like the same pairing artifact.

## Acceptance criteria

- [ ] Either the comparator stops pairing a Ruby `attr_reader`-backed predicate
      read against a same-named real call site, or the port carries the reader
      in a shape that gives the extractor a matching site.
- [ ] The `add_to`/`foreign_key` `kind: "args"` row in
      `scripts/api-compare/call-mismatches-exclude/activerecord/connection-adapters/abstract/schema-definitions.json`
      is deleted by hand (only-shrink; never `--write`).
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
