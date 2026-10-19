---
title: "rack spec_headers, spec_response, spec_utils, spec_lint take Rails' bodies (assertion parity)"
status: claimed
updated: 2026-10-19
rfc: "0193-small-gem-ports-parity-100"
cluster: rack-tests
packages: [rack]
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: "2026-10-19T19:18:03Z"
assignee: "rack-spec-headers-response-utils-lint-take-rails-bodies"
blocked-by: null
closed-reason: null
---

## Context

`parity:test --package rack --assertions` count mismatches: `spec_headers.rb` 34, `spec_response.rb` 15, `spec_utils.rb` 15, `spec_lint.rb` 24, with matching kind mismatches (see `--missing` for per-test detail). The tests exist by name but do not assert what Rails asserts. Existing: `tighten-assertion-mark-actionpack-and-rack-slack` (0127) and `rails-test-name-parity-rollout-rack`.

## Acceptance criteria

- [ ] 0 assertion-count, kind and value mismatches for these four files.
- [ ] Their TS-only extras move to `.trails.test.ts` siblings.
