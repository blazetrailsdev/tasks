---
title: "activerecord: SchemaDumper#formatted_version inserts through a ruby-compat String#insert"
status: ready
updated: 2026-10-07
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: findings
packages: ["activerecord", "ruby-compat"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-root-n-z` audit: the receipts below were `PERMANENT`, no CLAUDE.md section ratifies them, and they are re-tagged `CONVERGEABLE` onto this story.

`SchemaDumper#formatted_version`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/schema_dumper.rb:86-90`):

```ruby
stringified = @version.to_s
return stringified unless stringified.length == 14
stringified.insert(4, "_").insert(7, "_").insert(10, "_")
```

`packages/activerecord/src/schema-dumper.ts` `formattedVersion` builds the result from four `slice`s in
a template literal and carries `@missingRailsCall insert`. `String#insert`
(`vendor/ruby/v3.3.11/string.c` `rb_str_insert`) mutates the receiver and returns it; a JS string is
immutable, so the port is a function returning the new string, chained as Rails chains it. ruby-compat
has no `insert` export and `scripts/parity/ruby-compat.ts` has no `String#insert` row.

The local is also `s` where Rails names it `stringified`.

## Acceptance criteria

- [ ] ruby-compat exports `String#insert` at its MRI name, receipted, listed in the package README with this call site, and rowed in `scripts/parity/ruby-compat.ts`.
- [ ] `formattedVersion` is the three Rails lines, with the local named `stringified`; the receipt is deleted.
- [ ] `pnpm parity:api:calls`, `:calls:ruby-compat` and `:receipts:gate` green; `packages/activerecord/src/schema-dumper.test.ts` stays green.
