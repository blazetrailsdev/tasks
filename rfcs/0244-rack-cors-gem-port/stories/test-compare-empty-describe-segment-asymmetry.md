---
title: "test-compare drops an empty describe segment on the TS side only"
status: in-progress
updated: 2026-11-18
rfc: "0244-rack-cors-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#10319
claim: "2026-11-18T21:21:53Z"
assignee: "test-compare-empty-describe-segment-asymmetry"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test --assertions` reports one WRONG DESCRIBE row for rack-cors (trails#10306):

    ruby:  preflight requests >  > should not send failed preflight requests thru the app
    ts:    rack::cors > preflight requests > should not send failed preflight requests thru the app

The Rails side is `vendor/rack-cors/v3.0.0/test/unit/cors_test.rb:393-418`, a `describe ''` nested inside `describe 'preflight requests'` inside `describe Rack::Cors`. The Ruby extractor drops the constant outer describe (`Rack::Cors`) but keeps the empty-string segment. The TS extractor keeps the outer describe and drops the empty `describe("", ...)` segment. Every other test in the file pairs, because neither special case comes into play there. The test name and nesting in `packages/rack-cors/test/unit/cors.test.ts` are verbatim.

## Acceptance criteria

- The Ruby and TS describe-path normalization in `scripts/test-compare/` treats an empty-string `describe` segment the same way on both sides: either both keep it or both drop it.
- rack-cors reports 0 wrong describe with no change to `cors.test.ts`.
- A unit test in `scripts/test-compare/` covers a nested `describe ''`.
