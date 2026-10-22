---
title: "Http::URL.normalize_protocol raises a bare Error, not ArgumentError"
status: ready
updated: 2026-10-19
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::Http::URL.normalize_protocol` raises
`ArgumentError, "Invalid :protocol option: #{protocol.inspect}"` for an
unrecognised protocol (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/url.rb:144`).
trails throws a bare `Error` there (`packages/actionpack/src/action-dispatch/http/url.ts:78`);
the message already matches. The other site this story named, `full_url_for`'s
missing-host raise, has converged (`url.ts:187`, `ArgumentError`).

`path_for` also guards `options.key?(:path)` (`url.rb:73`); check that trails'
guard is the key test Rails makes and not a `!== undefined` read.

## Acceptance criteria

- `normalizeProtocol` throws ruby-compat's `ArgumentError` with Rails' message.
- `pathFor`'s `:path` guard is `"path" in options` (Ruby `key?`).
- The Rails `url_for_test.rb` / `url_test.rb` case asserting `ArgumentError` for
  an invalid protocol asserts the class.
