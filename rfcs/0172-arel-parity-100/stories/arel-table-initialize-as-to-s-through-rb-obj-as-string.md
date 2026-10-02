---
title: "arel: Table#initialize spells as.to_s as a conditional because rbObjAsString keeps a Symbol's colon"
status: draft
updated: 2026-10-02
rfc: "0172-arel-parity-100"
cluster: arms
packages: ["arel", "ruby-compat"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Left over from `arel-converge-invented-control-flow-arms`: `pnpm parity:api:arms:report --package=arel` still lists `table.ts#constructor` at `+if`.

Rails (`vendor/rails/v8.0.2/activerecord/lib/arel/table.rb:24-26`):

```ruby
if as.to_s == @name
  as = nil
end
```

`packages/arel/src/table.ts:49` spells the `to_s` as a conditional, `(isSymbol(as) ? symbolToS(as) : as) === this.name`, because ruby-compat's `rbObjAsString` (`packages/ruby-compat/src/object.ts`, the port of `rb_obj_as_string`, `vendor/ruby/v3.3.11/string.c:1653`) answers a Symbol (`":users"`) with its colon still on, where `Symbol#to_s` (`rb_sym_to_s`, `string.c:11734`) drops it. It also answers `""` for `nil`, which the conditional does not: `Table.new("", as: nil)` compares `"" == ""` in Rails.

Related: `rb-obj-as-string-skips-to-s-dispatch` (RFC 0154), the same function's missing `to_s` dispatch.

## Acceptance criteria

- [ ] `rbObjAsString(":users")` answers `"users"`, with its callers checked for a Symbol they relied on rendering with the colon.
- [ ] `Table`'s constructor reads `if (rbObjAsString(as) === this.name)`, and `pnpm parity:api:arms:report --package=arel` no longer lists `table.ts#constructor`.
