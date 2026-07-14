---
title: "converge-arel-array-string-elements-to-content-based-quoting"
status: done
updated: 2026-07-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4872
claim: "2026-07-14T19:41:18Z"
assignee: "converge-arel-array-string-elements-to-content-based-quoting"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while implementing `converge-arel-array-booleans-to-unquoted-true`
(PR #4869). While verifying how Rails emits boolean array elements, a broader
divergence turned up in the same function.

`quoteArrayLiteral` (`packages/arel/src/quote-array.ts`) decides array-element
quoting by **type**: strings are always wrapped in `"..."`. Rails delegates the
whole `{...}` encoding to the pg gem's `PG::TextEncoder::Array`, which quotes by
**content** — it wraps an element only when the text would otherwise be
ambiguous. Verified directly against Ruby:

```ruby
e = PG::TextEncoder::Array.new
e.encode([true, false, "a", "2026-04-26 14:23:55", 1])
# => {true,false,a,"2026-04-26 14:23:55",1}

e.encode(["a"])                => {a}
e.encode([""])                 => {""}
e.encode(["NULL"])             => {"NULL"}
e.encode(["a b"])              => {"a b"}
e.encode(["a,b"])              => {"a,b"}
e.encode(["a{b"])              => {"a{b"}
e.encode(['he said "hi"'])     => {"he said \"hi\""}
e.encode(["a\\b"])             => {"a\\b"}
e.encode([nil])                => {NULL}
e.encode([["x"]])              => {{x}}
```

So the rule is: quote when the element is empty, is `NULL`, or contains a
delimiter (`,` `{` `}`), whitespace, a double quote, or a backslash. Otherwise
emit bare. Note `["true"]` (the _string_) also encodes to `{true}` — the encoder
never inspects type.

trails emits `{"a","b","c"}` where Rails emits `{a,b,c}`. Against PG this is
cosmetic (both parse identically), so this is a **fidelity/structural** gap, not
a live bug — scope and review it as such. It is the same class of
divergence as PR #4869 (which fixed only the boolean arm) and PR #4867
(dates), both of which worked around the type-based quoting rather than replacing it. PR #4867's
`formatElement` hook force-quotes every element it formats, which is why dates
appear correct there — a date contains a space, so it needs quoting anyway.

Doing this properly likely subsumes both hooks: split the function into a
`type_cast`-equivalent that returns a _value_ and an encoder that decides
quoting from the resulting content, mirroring Rails' two stages.

## Acceptance criteria

- [ ] Array elements are quoted by content, matching `PG::TextEncoder::Array`'s
      rule (empty / `NULL` / delimiter / whitespace / quote / backslash), not by
      JS type.
- [ ] The cases in the Ruby transcript above are pinned as unit tests.
- [ ] Existing `{"a","b","c"}`-shaped expectations across the suite are updated
      to the Rails form, not worked around.
- [ ] Coordinate with / land after #4869 and #4867 — all three touch
      `quote-array.ts`.
- [ ] api:compare / test:compare delta non-negative.
