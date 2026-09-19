---
title: "rack-body-proxy-respond-to-missing-to-path"
status: draft
updated: 2026-09-19
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `connection_management_test.rb` "proxy is polite to its body and responds to it"
(`vendor/rails/activerecord/test/cases/connection_management_test.rb:118-124`).

Rails: `assert_respond_to response_body, :to_path` then `assert_equal "/path", response_body.to_path`
on a `Rack::BodyProxy` (its `respond_to_missing?` forwards to the wrapped body).

trails' `BodyProxy` (`packages/rack/src/body-proxy.ts`) exposes `respondTo(name)` / `delegate(name)`
methods but no `toPath` property, so `assertRespondTo(proxy, "toPath")` fails and `proxy.toPath()`
does not exist. Parked `it.skip` in `packages/activerecord/src/connection-management.test.ts`,
converged body intact. Cause beyond that not investigated.

## Acceptance criteria

- `BodyProxy` answers `respondTo`-style probes and forwards `toPath` as Rack's does.
- The parked test is un-skipped and passes.
