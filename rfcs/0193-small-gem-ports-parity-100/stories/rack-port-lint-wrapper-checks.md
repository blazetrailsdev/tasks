---
title: "Port Rack::Lint::Wrapper's checks and body/stream wrappers (lint.rb 6/26)"
status: done
updated: 2026-10-21
rfc: "0193-small-gem-ports-parity-100"
cluster: rack-api
packages: [rack]
deps: [rack-lint-wrapper-to-ary-unported]
deps-rfc: []
est-loc: 650
priority: null
pr: trails#9181
claim: "2026-10-21T18:57:39Z"
assignee: "rack-port-lint-wrapper-checks"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rack/v3.1.14/lib/rack/lint.rb` (991 lines) scores 6/26. Missing `Rack::Lint::Wrapper` members: `#response`, `#check_environment`, `#check_input_stream`, `#check_hijack`, `#check_hijack_response`, `#check_early_hints`, `#check_content_type_header`, `#check_content_length_header`, `#verify_content_length`, `#check_rack_protocol_header`, `#close`, `#verify_to_path`, `#each`, `#to_path`, `#to_ary`, plus `InputWrapper#gets`, `#read` and `ErrorWrapper#puts`, `#write`, `#flush`. `#to_ary` is already filed as `rack-lint-wrapper-to-ary-unported` (a deps edge). Also referenced: `handler-node-rack-errors-fails-rack-lint` (0142). The spec is `vendor/rack/v3.1.14/test/spec_lint.rb`, which has 24 assertion-count mismatches.

## Acceptance criteria

- [ ] `parity:api` reports 26/26 for `lint.rb`, with no new call or call-argument rows.
- [ ] `spec_lint.rb` tests run with Rails' bodies (assertion work beyond the members this PR ports stays in `rack-spec-headers-response-utils-lint-take-rails-bodies`).
