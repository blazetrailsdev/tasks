---
title: "rack remaining specs take Rails' bodies: deflater, files, static, builder, mock_response, mock_request, directory, rewindable_input, body_proxy, common_logger"
status: draft
updated: 2026-10-15
rfc: "0193-small-gem-ports-parity-100"
cluster: rack-tests
packages: [rack]
deps:
  [
    rack-spec-request-and-multipart-take-rails-bodies,
    rack-spec-headers-response-utils-lint-take-rails-bodies,
    port-rack-spec-request-test-proxy-request-inherited-examples,
  ]
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`parity:test --package rack --assertions` count mismatches: `spec_deflater.rb` 27, `spec_files.rb` 17, `spec_static.rb` 18, `spec_builder.rb` 11, `spec_mock_response.rb` 16, `spec_mock_request.rb` 2, `spec_directory.rb` 7, `spec_rewindable_input.rb` 7, `spec_body_proxy.rb` 1, `spec_common_logger.rb` 2. Kind and value mismatches for the same files are listed by `--missing`. There are 76 TS-only extra tests across rack in total.

## Acceptance criteria

- [ ] 0 assertion-count, kind and value mismatches for these files.
- [ ] rack test parity reaches 100%, with 0 TS-only tests in Rails-named files, with the deps stories done (the 97-test `spec_request.rb` gap is `port-rack-spec-request-test-proxy-request-inherited-examples`).
