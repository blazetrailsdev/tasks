---
title: "parity: the call-argument gate aligns the receiver of function-form sort; Thor required_options sorts by byte"
status: claimed
updated: 2026-10-03
rfc: "0179-api-compare-crediting-rules"
cluster: null
packages: []
deps:
  - call-args-gate-aligns-the-receiver-of-a-function-form-hash-merge
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-10-03T01:55:21Z"
assignee: "call-args-gate-aligns-the-receiver-of-function-form-sort"
blocked-by: null
closed-reason: null
---

## Context

`Thor::Command#required_options` (`vendor/thor/v1.3.2/lib/thor/command.rb:92`) is
`options.map { |_, o| o.usage if o.required? }.compact.sort.join(" ")`. Ruby's `Array#sort` orders
Strings by byte (`rb_str_cmp`); the port (`packages/trailties/src/thor/command.ts`
`requiredOptions`, trails#8414) calls native `.sort()`, which orders by UTF-16 code unit. The two
agree for ASCII and differ for an astral character against a BMP one above U+D7FF, which a
non-ASCII option banner can produce.

ruby-compat's `sort` (`packages/ruby-compat/src/array.ts:764`, `rb_ary_sort`) is the faithful port,
but its function form `sort(ary)` reds `parity:api:calls:args`:

```text
+ thor  command.ts  required_options  sort()  (thor/command.json)
```

because `sort` is not in `RECEIVER_AS_FIRST_ARG` (`scripts/api-compare/receiver-as-first-arg.ts:28`),
so the receiver is read as an argument Rails does not pass.

## Acceptance criteria

- [ ] The call-argument gate aligns the receiver of function-form `sort`, by the same rule its
      siblings in this RFC use for `fetch` / `max` / `prepend` / `merge`.
- [ ] `requiredOptions` calls ruby-compat's `sort`, with no baseline row and no `@missingRailsArgs`.
- [ ] A test with two usages that order differently by byte and by code unit.
