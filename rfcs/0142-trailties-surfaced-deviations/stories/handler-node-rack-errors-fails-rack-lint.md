---
title: "rack: Handler::Node's rack.errors has no puts or flush, so Rack::Lint rejects every env"
status: draft
updated: 2026-10-06
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["rack", "ruby-compat"]
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

Found writing trails#8566. `Rack::Lint` rejects the env `Rack::Handler::Node` builds, for every
request: `packages/rack/src/handler/node.ts` sets `env["rack.errors"]` to ruby-compat's `stderr`
(`packages/ruby-compat/src/process-adapter.ts:124`, a `StdStream`), which has `write` but no `puts`
or `flush`, and `Lint#checkErrorStream` (`packages/rack/src/lint.ts:175-181`) requires all three:
"rack.error [object Object] does not respond to #puts".

Rack: `vendor/rack/lib/rack/lint.rb` `check_error_stream` requires `puts`, `write` and `flush`;
`$stderr`, which every Ruby handler passes, has them.

The test in trails#8566 lints the upgrade env with a compliant error stream substituted, and says so.

## Expected shape

`rack.errors` in the handler's env responds to `puts`, `write` and `flush`, so an application can
run `Rack::Lint` in front of itself in development as Rails' generated `config.ru` allows.

## Acceptance criteria

- [ ] A test wraps an app in `Rack::Lint` behind a real `Handler.Node` and an ordinary request passes with the handler's own `rack.errors`.
- [ ] The substitution in `packages/rack/src/handler/node.test.ts` is removed.
