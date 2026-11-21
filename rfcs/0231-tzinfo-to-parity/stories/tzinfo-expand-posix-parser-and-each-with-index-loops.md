---
title: "tzinfo-expand-posix-parser-and-each-with-index-loops"
status: draft
updated: 2026-11-21
rfc: "0231-tzinfo-to-parity"
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

`tzinfo-expand-remaining-define-method-loops` expanded the three ternary loops
(`tc_zoneinfo_data_source.rb:900`, `tc_zoneinfo_reader.rb:1376`,
`tc_transition_rule.rb:510`) by adding a bare-cell truthiness condition, a
`cell == <int>` condition and a `true` cell to `scripts/test-compare/extract-ruby-tests.rb`
(`eval_loop_condition`, `eval_loop_cell_truthiness`, `array_element_value`),
gated to `@define_method_loop`. Six rows remain in `UNEXPANDED_LOOP_REASONS["tzinfo"]`:

- `data_sources/tc_posix_time_zone_parser.rb:61`, `:69`: constant table `ABBREVIATIONS_WITH_OFFSETS` with `-HOUR` cells; `@const_arrays` could resolve them if the cell's opaque value is not interpolated into the name.
- `tc_posix_time_zone_parser.rb:104`: name interpolates a body local (`tz_string = abbrev_and_offset + dst_suffix`).
- `tc_posix_time_zone_parser.rb:119`: name interpolates `append_time_to_rule(...)`.
- `tc_transition_rule.rb:375`, `:475`: `each_with_index` over a bound row cell, one nesting `(1..4).each`.

## Acceptance criteria

- [ ] Each loop expands, or keeps its row with a reason stating why no static expansion is possible.
- [ ] Other packages' `parity:test` counts do not change; new forms stay gated to `define_method` loops.
