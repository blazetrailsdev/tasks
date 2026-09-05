---
title: "PG quote splits the Numeric arm, invents an integer arm, and reorders"
status: ready
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 110
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the RFC 0077 close-out sweep (2026-08-30), re-verified on main. The
other point-3 survivor: PG `quote`'s arm set and arm order diverge from Rails.

`postgresql/quoting.rb:100-127` is a single `case value` with, in order:
`OID::Xml::Data`, `OID::Bit::Data`, `Numeric`, `OID::Array::Data`, `Range`,
`else super`. The `Numeric` arm is **one** arm holding the `finite?` branch:

```ruby
when Numeric
  if value.finite?
    super
  else
    "'#{value}'"
  end
```

`postgresql/quoting.ts:96-125` diverges three ways:

1. **The `Numeric` arm is split in two and separated.** A `!Number.isFinite`
   arm sits in the `Numeric` slot, and a _second_ integer arm
   (`typeof value === "bigint" || Number.isInteger(value)` -> `String(value)`)
   sits after `Range`, immediately before the `super` fallthrough. Rails has no
   such arm — a finite Numeric goes to `super`.
2. **The `Bit::Data` arm invents a fallthrough return.**
   `return null as unknown as string` where Ruby's `elsif` chain simply yields
   `nil`; the cast launders a `nil` into a declared `string`.
3. Arm ORDER therefore differs from Rails' for every value reaching the tail.

The two rows the 2026-08-09 note listed alongside this one are **already
converged** and are not in scope: `check_int_in_range` IS called
(`postgresql/quoting.ts:101`) and `quote_table_name` DOES call
`extractSchemaQualifiedName` (`:61`). `quote_string`'s missing
`with_raw_connection` is tracked separately by
`pg-quote-string-escapes-without-with-raw-connection` (RFC 0073).

## Acceptance criteria

- PG `quote` carries Rails' six arms in Rails' order, with `finite?` as a
  branch _inside_ the Numeric arm rather than as two separated arms.
- The trailing integer -> `String(value)` arm is gone; a finite Numeric reaches
  the abstract `quote`.
- The `BitData` arm no longer returns a cast `null`; it mirrors Ruby's
  `elsif` chain yielding nothing.
- Verify against `postgresql/quoting.rb:100-127`. No new call/args baseline rows.
