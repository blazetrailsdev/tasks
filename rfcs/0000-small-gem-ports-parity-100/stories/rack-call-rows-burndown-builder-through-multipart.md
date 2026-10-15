---
title: "Burn rack's call-mismatch rows to zero: builder, common_logger, directory, head, headers, lock, media_type, mime, mock_response, multipart"
status: draft
updated: 2026-10-15
rfc: "0000-small-gem-ports-parity-100"
cluster: rack-calls
packages: [rack]
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Raw `output/call-mismatches.json` rows (trails `31c40b1da4`), baselined under `scripts/api-compare/call-mismatches-exclude/rack/` since `6fd876d288` (2026-08-05):

- `builder.rb`: `use` omits `generate_map`; `to_app` / `load_file` omit `fail`; `new_from_string` omits `call`.
- `common_logger.rb log`: order `extractContentLength,constructor`.
- `directory.rb`: `get` omits `unescape_path`; `check_bad_request` omits `valid_path?`; `list_directory` omits `escape_path`; `each` omits `escape_html`.
- `head.rb call` / `lock.rb call`: omit `new`.
- `headers.rb`: `transform_keys` omits `transform_keys!`; `transform_keys!` omits `new` and `replace`.
- `media_type.rb params` omits `strip_doublequotes`; `mime.rb mime_type` omits `fetch`.
- `mock_response.rb`: `body` omits `new`; `cookie` omits `fetch`; `parse_cookies_from_header` has the wrong order.
- `multipart/generator.rb`: `dump` omits `map`; `flattened_params` omits `build_multipart`. `multipart/parser.rb`: `result`, `handle_mime_head` (with `find_encoding`), `normalize_filename` omit `new`; `check_part_limits` omits `multipart_file_limit` / `multipart_total_part_limit`.

Related existing stories: `rack-multipart-parser-locals-abbreviated`, `rack-multipart-parser-tempfile-factory-constant`, `rack-builder-parse-file-ru-guard-and-require-arm`.

## Acceptance criteria

- [ ] Each TS body calls what the Ruby body calls, in Ruby's order.
- [ ] The matching shards (`builder.json`, `common-logger.json`, `directory.json`, `head.json`, `headers.json`, `lock.json`, `media-type.json`, `mime.json`, `mock-response.json`) lose their call rows by deletion, followed by `pnpm parity:api:calls:tighten`, never by a reseed.
- [ ] None of the listed files has a row left in `output/call-mismatches.json`.
