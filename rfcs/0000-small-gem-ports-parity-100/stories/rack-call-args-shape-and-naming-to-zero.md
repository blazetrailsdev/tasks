---
title: "rack call-argument rows to zero (8 shape, 18 naming) and enroll rack in NAMING_ENROLLED_PACKAGES"
status: draft
updated: 2026-10-15
rfc: "0000-small-gem-ports-parity-100"
cluster: rack-calls
packages: [rack]
deps:
  [
    rack-converge-events,
    rack-api-residual-members-inheritance-arity,
    rack-call-rows-burndown-builder-through-multipart,
    rack-recursive-include-env-merge-and-argumenterror,
  ]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`output/call-arg-mismatches.json` has 26 rack rows (events rows belong to `rack-converge-events`). Shape: `common_logger log` `new(env)` vs `new()`; `directory list_directory` `mime_type(extname)` vs `(extname, nil)`; `multipart/generator flattened_params` `new()` vs `new(v, false)`; `multipart/parser initialize` `new(dup)` vs `new("")`; `on_mime_head` `new()` vs five args; `query_parser new_depth_limit` passes two extra; `recursive include` `new("")` vs `new(path, "http://localhost")` (see `rack-recursive-include-env-merge-and-argumenterror`); `show_exceptions pretty` `template()` vs four args (owned by `rack-api-residual-members-inheritance-arity`, whose arity fix clears it); `utils status_code` drops `uplevel: 3`. Naming: `builder to_app` (`_run`/`_map`), `deflater each` (`from`→`part`), `directory list_directory` (`fullEntry`), `lint check_headers` (`v`), `mock_response` (`filling`), `generator multipart?` (`_params`), `parser result` (`body`→`data`), `query_parser` (`p`→`s`), `show_exceptions h` (`str`→`obj`), `static call` (`origPath`/`servePath`→`path`), `utils parse_cookies_header` (`val`). The related `param-drift-rack` story is in 0127. `directory list_directory`'s two rows (shape `mime_type`, naming `fullEntry`) are owned by `rack-call-rows-burndown-builder-through-multipart`, which rewrites that body; the `recursive include` row is owned by `rack-recursive-include-env-merge-and-argumenterror` (deps). This story owns every other row. Shape rows are baselined in rack's `common-logger`, `directory`, `query-parser`, `recursive`, `show-exceptions` and `utils` shards.

## Acceptance criteria

- [ ] 0 rack rows in `output/call-arg-mismatches.json`, with every args row deleted from the rack shards.
- [ ] `rack` is added to `NAMING_ENROLLED_PACKAGES` (`scripts/api-compare/lint-call-args.ts`, only-grow), and `pnpm parity:api:calls:args` stays green.
