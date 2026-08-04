---
title: "Cover the full sprintf grammar reachable from %<name>fmt"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6093
claim: "2026-08-04T21:11:10Z"
assignee: "i18n-date-parse-eu-us-gate-misses-have-digit"
blocked-by: null
closed-reason: null
---

## Context

`sprintf` in `packages/i18n/src/interpolate/ruby.ts` is a hand-rolled
reimplementation. Rails delegates to Ruby's builtin at
`vendor/i18n/lib/i18n/interpolate/ruby.rb:45`:

```ruby
$3 ? sprintf("%#{$3}", value) : value
```

JS has no `sprintf`, so _some_ reimplementation is permanent. What is not
permanent is its coverage. 24 cases were diffed against live `ruby -e` output
when it was written and all match, but that set was driven by review findings,
not by the grammar:

- flag combinations (`%+.3e`, `% 08.2f`, `%-+d`, `%#.5g`)
- `%c` with a multibyte codepoint and with a multi-char String
- `%b`/`%o`/`%x` of negative values (Ruby prints `..f` two's-complement forms
  for `%x` with no sign flag)
- non-numeric input to a numeric conversion (Ruby raises `ArgumentError`;
  ours coerces through `Number()` and emits `NaN`)

The reachable conversion set is fixed by the pattern at
`vendor/i18n/lib/i18n/interpolate/ruby.rb:9` — `[bBdiouxXeEfgGcps]` — so the
grammar to cover is bounded and enumerable.

## Acceptance criteria

- A table-driven test enumerates the conversion set crossed with the `-+ #0`
  flags, width, and precision, with every expectation taken from real `ruby -e
'sprintf(...)'` output.
- Divergences the table surfaces are fixed in `sprintf`, or — where Ruby raises
  — the raise is reproduced rather than silently coerced.
- The `@noRailsEquivalent`-adjacent JSDoc on `sprintf` states which grammar is
  covered, so the next reader knows the bound.
