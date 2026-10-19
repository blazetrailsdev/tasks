---
title: "Burn rack's call-mismatch rows to zero: request, response, rewindable_input, show_exceptions, show_status, static, tempfile_reaper, urlmap, utils"
status: done
updated: 2026-10-19
rfc: "0193-small-gem-ports-parity-100"
cluster: rack-calls
packages: [rack]
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: trails#9066
claim: "2026-10-19T14:18:20Z"
assignee: "rack-call-rows-burndown-request-through-utils"
blocked-by: null
closed-reason: null
---

## Context

Raw rows (trails `31c40b1da4`), baselined since `6fd876d288`:

- `request.rb`: `update_param` omits `has_key?`; `delete_param` omits `delete`; `query_parser` omits `default_query_parser`.
- `response.rb`: `delete_header` omits `delete`; `buffered_body!` omits `call` (see `rack-response-buffered-body-bypasses-the-writer-and-never-closes-the-body`).
- `rewindable_input.rb make_rewindable` omits `new` and `write`.
- `show_exceptions.rb accepts_html?` omits `best_q_match`. `show_status.rb call` and `tempfile_reaper.rb call` omit `new`.
- `static.rb applicable_rules` omits `unescape`. `urlmap.rb call` omits `include?`.
- `utils.rb`: `unescape_path` omits `unescape`; `build_nested_query` omits `delete_if`; `forwarded_values` omits `map`; `status_code` omits `fetch`.
- The `rubyCompat` rows in `request.json` and `utils.json` are included.

## Acceptance criteria

- [ ] Each TS body calls what Rails calls (trails CLAUDE.md native-hash table for `delete`/`has_key?`; `fetch` / `delete_if` stay ruby-compat).
- [ ] The `request.json`, `response.json`, `rewindable-input.json`, `show-exceptions.json`, `show-status.json`, `static.json`, `tempfile-reaper.json`, `urlmap.json` and `utils.json` call rows are deleted, then tightened.
- [ ] No row is left for these files in `output/call-mismatches.json`.
