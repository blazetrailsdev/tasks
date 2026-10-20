---
title: "rack-sendfile-variation-header-arm-vs-vendored"
status: done
updated: 2026-10-20
rfc: "0193-small-gem-ports-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9110
claim: "2026-10-20T00:17:53Z"
assignee: "rack-sendfile-variation-header-arm-vs-vendored"
blocked-by: null
closed-reason: null
---

## Context

`Rack::Sendfile#variation` in the vendored reference (`vendor/rack/v3.1.14/lib/rack/sendfile.rb:148-152`) reads `@variation || env['sendfile.type'] || env['HTTP_X_SENDFILE_TYPE']`. `packages/rack/src/sendfile.ts` `variation(env)` omits the `HTTP_X_SENDFILE_TYPE` arm, and `packages/rack/src/sendfile.test.ts` ("ignores HTTP_X_SENDFILE_TYPE header ...") asserts the header is ignored, matching the later upstream security fix rather than v3.1.14. The vendored spec (`test/spec_sendfile.rb:51-128`) still drives the header.

## Acceptance criteria

- [ ] Bump vendored rack to the release carrying the sendfile header fix and port its `variation` / `map_accel_path` bodies and specs, or restore the v3.1.14 arm; the port and the vendored source agree.
