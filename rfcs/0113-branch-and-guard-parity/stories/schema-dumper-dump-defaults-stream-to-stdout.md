---
title: "SchemaDumper.dump defaults its stream to a StringIO where Rails defaults to $stdout"
status: ready
updated: 2026-09-11
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 66
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActiveRecord::SchemaDumper.dump`
(`vendor/rails/activerecord/lib/active_record/schema_dumper.rb:44`) defaults
its stream to `$stdout`:

```ruby
def dump(pool = ActiveRecord::Base.connection_pool, stream = $stdout, config = ActiveRecord::Base)
```

Since trails#7712 the dumper writes to a real `IO | StringIO`, but
`packages/activerecord/src/schema-dumper.ts` `static dump` defaults the stream
to `new StringIO()`. Every caller that relies on the default then reads the
returned stream's `.string()`: `support/schema-dumping-helper.ts` and the
`schema-dumper` tests. Rails' `SchemaDumpingHelper`
(`vendor/rails/activerecord/test/support/schema_dumping_helper.rb:11-13`)
captures `$stdout` with `capture_io` instead.

## Converged shape

- `static dump`'s `stream` default is the ruby-compat `stdout` IO.
- `schema-dumping-helper.ts` captures stdout the way `capture_io` does (or
  passes an explicit `StringIO`), instead of depending on the default.
- Tests that call `SchemaDumper.dump(source)` with no stream pass
  `new StringIO()` explicitly.

## Acceptance criteria

- [ ] `SchemaDumper.dump`'s default stream is stdout, as in `schema_dumper.rb:44`.
- [ ] No caller relies on a `StringIO` default; all schema-dumper tests stay green under their current names.
- [ ] `pnpm parity:api:calls:args` stays green.
