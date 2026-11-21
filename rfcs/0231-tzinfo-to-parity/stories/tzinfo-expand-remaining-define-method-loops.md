---
title: "Expand tzinfo's 9 listed define_method loops in the Ruby test extractor"
status: draft
updated: 2026-11-21
rfc: "0231-tzinfo-to-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10465 lists 9 tzinfo `define_method` loops in `UNEXPANDED_LOOP_REASONS` (`scripts/test-compare/extract-ruby-tests.rb`), so their Rails tests are not counted:

- `data_sources/tc_posix_time_zone_parser.rb:61`, `:69`: a constant table (`ABBREVIATIONS_WITH_OFFSETS`) with `-HOUR` cells. `@const_arrays` resolves these without the opaque-cell rule.
- `tc_posix_time_zone_parser.rb:104`: the name interpolates a body local (`tz_string = abbrev_and_offset + dst_suffix`).
- `tc_posix_time_zone_parser.rb:119`: the name interpolates a helper call (`append_time_to_rule`).
- `tc_zoneinfo_data_source.rb:900`, `tc_zoneinfo_reader.rb:1376`, `tc_transition_rule.rb:510`: ternaries over nil, boolean or `==` cells.
- `tc_transition_rule.rb:375`, `:475`: `each_with_index` over a bound row cell, one with a nested `(1..4).each`.

## Acceptance criteria

- [ ] Each loop expands, or keeps its row with a reason for why no static expansion is possible.
- [ ] The other packages' `parity:test` matched counts do not drop. Gate any new value form to `define_method` loops, as #10465 did.
