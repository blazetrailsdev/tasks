---
title: "rack spec_request.rb and spec_multipart.rb tests take Rails' bodies (assertion parity)"
status: done
updated: 2026-10-20
rfc: "0193-small-gem-ports-parity-100"
cluster: rack-tests
packages: [rack]
deps: [port-rack-spec-request-test-proxy-request-inherited-examples]
deps-rfc: []
est-loc: 650
priority: null
pr: trails#9154
claim: "2026-10-20T22:53:32Z"
assignee: "rack-spec-request-and-multipart-take-rails-bodies"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test --package rack --assertions --missing` reports `spec_request.rb` with 55 count and 62 kind mismatches, and `spec_multipart.rb` with 41 count and 47 kind mismatches. Example: `it 'can add to multivalued headers in the env'` (`vendor/rack/v3.1.14/test/spec_request.rb:92`) asserts `assert_equal '1', req.add_header('FOO', '1')` four times and more, while `packages/rack/src/request.test.ts:109` sets `HTTP_X_MULTI` and asserts one `toBe`. `copies the env when duping` (`:15`) is a `refute_same` that the port does not make. The 97 inherited `TestProxyRequest` examples (`spec_request.rb:1922`) are `port-rack-spec-request-test-proxy-request-inherited-examples`, a deps edge. The 22 TS-only extras in `request.test.ts` go to a `.trails.test.ts` sibling, or are deleted.

## Acceptance criteria

- [ ] 0 assertion-count, kind and value mismatches for both files.
- [ ] `spec_request.rb` 194/194 (with the deps story) and `spec_multipart.rb` fully matched; 0 TS-only tests in either Rails-named file.
- [ ] Any comparer mapping gap that is found gets its own script story filed under this RFC, not a softened test.
