---
title: "Kernel#format is not ported, so PG OID::DateTime open-codes its %04d padding"
status: draft
updated: 2026-09-08
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: ["ruby-compat", "activerecord"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `Kernel#format` has no trails port. `grep -rn "export function format" packages/*/src`
finds only `actionpack`'s `ActionDispatch::Http::MimeNegotiation#format`, which is a
different method; `packages/i18n/src/interpolate/ruby.ts:60` carries a private,
package-local `sprintf` that handles only the specs the i18n interpolation syntax
admits and is not exported.

So every ported body that calls `format(...)` has to open-code the padding, and the
call-parity gate scores the omission. The instance that surfaced this is PG
`OID::DateTime#cast_value`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/oid/date_time.rb:14`):

```ruby
value = value.sub(/^\d+/) { |year| format("%04d", -year.to_i + 1) }
```

PR for `pg-oid-datetime-bc-arm-bypasses-super` converged that arm to the Rails
three lines (rewrite the year, delete the `" BC"` suffix, `super`) but had to spell
`format("%04d", n)` as a sign-aware `padStart`, and so carries
`@missingRailsCall format — CONVERGEABLE <this story>` in
`packages/activerecord/src/connection-adapters/postgresql/oid/date-time.ts`.

## Acceptance criteria

- [ ] `format` / `sprintf` are ported to `@blazetrails/ruby-compat` at the Ruby
      names, covering at least the flag/width/precision specs Ruby documents for
      the integer, float and string conversions the repo actually calls.
- [ ] PG `OID::DateTime#cast_value` calls it and drops its `@missingRailsCall
    format` receipt; `pnpm parity:api:calls` stays green.
- [ ] `grep -rn "padStart\|padEnd" packages/*/src` is reviewed for other
      open-coded `format` call sites and each is either converted or listed here.
