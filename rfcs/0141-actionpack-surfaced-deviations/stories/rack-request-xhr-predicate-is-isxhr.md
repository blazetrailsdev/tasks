---
title: "Rack::Request::Helpers#xhr? ports as isXhr(), not an xhr getter"
status: ready
updated: 2026-10-22
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rack's `Helpers#xhr?` (`vendor/rack/v3.1.14/lib/rack/request.rb`, `def xhr?`) is a predicate. trails ports it as a `get xhr(): boolean` getter in `packages/rack/src/request.ts`. That breaks the repo's predicate rule (`foo?` is answered by `isFoo`), and `spec_request.rb`'s "figure out if called via XHR" (`vendor/rack/v3.1.14/test/spec_request.rb`) has to read `req.xhr` in `packages/rack/src/request.test.ts`. Surfaced on trails#9146.

## Acceptance criteria

- [ ] `xhr?` is `isXhr()` on `Rack::Request::Helpers`, and every caller is updated (including any ActionDispatch counterpart that reads the rack getter).
- [ ] "figure out if called via XHR" asserts `req.isXhr()`.
