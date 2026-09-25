---
title: "pretty-print-never-wraps-at-width"
status: ready
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
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

`packages/activerecord/src/pretty-print.ts` `PrettyPrint` is a flat buffer:
`breakable(sep)` always emits `sep` and `group(indent, open, close)` ignores
`indent`, so `pp` never wraps. Ruby's `PP` is Wadler's `PrettyPrint`
(`lib/ruby/3.3.0/prettyprint.rb`, width 79), so a record wider than 79 columns
renders one attribute per line.

`vendor/rails/activerecord/test/cases/core_test.rb:109-197`
(`test_pretty_print_new`, `_persisted`, `_full`) expect that multi-line layout:

```text
#<Topic:0x\w+
 id: 1,
 title: "The First Topic",
 ...
```

`packages/activerecord/src/core.test.ts` "pretty print new" / "persisted" /
"full" instead assert the single-line `#<Topic:0x… id: 1, title: …>` shape
(`object_address_group`'s `#<Topic:0x…` prefix was converged in the PR that
closed `relation-pretty-print-record-format`).

## Acceptance criteria

- `PrettyPrint` ports `prettyprint.rb`'s `text` / `breakable` / `group` /
  `nest` layout (width 79 by default, as `PP.pp` passes).
- The three core.test.ts pretty-print tests assert Rails' multi-line expected
  strings verbatim.
