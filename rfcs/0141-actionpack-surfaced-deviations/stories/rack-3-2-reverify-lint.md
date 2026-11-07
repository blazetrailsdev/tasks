---
title: "rack-3-2-reverify-lint"
status: in-progress
updated: 2026-11-07
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9831
claim: "2026-11-07T14:01:49Z"
assignee: "rack-3-2-reverify-lint"
blocked-by: null
closed-reason: null
---

## Context

`bump-vendored-rack-anchor-to-3-2` moved the rack anchor to `v3.2.8`. `vendor/rack/v3.2.8/lib/rack/lint.rb` is rewritten (887 lines of diff against v3.1.14). The drifted pins `check_error_stream`, `check_header_value`, `check_headers`, `initialize` were re-pinned without re-verification. TS: `packages/rack/src/lint.ts`.

## Acceptance criteria

- `Rack::Lint` mirrors v3.2.8 method by method (`initialize`, `check_headers`, `check_header_value`, `check_error_stream` and every method 3.2 adds), and `spec_lint.rb` changes are re-ported.
