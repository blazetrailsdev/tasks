---
title: 'rack middleware spells @app.call(env) directly, not rbFSend(app, "call")'
status: draft
updated: 2026-10-21
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Each rack middleware calls the next app through `rbFSend(app, "call", env)`, a send whose name is a string literal. Rails writes `@app.call(env)` directly. For example, `vendor/rack/v3.1.14/lib/rack/mock_request.rb:76` has `status, headers, body = app.call(env)`, and trails ports it as `packages/rack/src/mock-request.ts:104` `rbFSend(app, "call", env)`. CLAUDE.md § "A dispatch by name is spelled directly" rules that a send with a literal name is a direct call with its types thrown away.

Sites: about 27 non-test files in packages/rack/src, including builder.ts (3), conditional-get.ts, recursive.ts, static.ts (2 each), and cascade, common-logger, config, content-length, content-type, deflater, etag, events, head, lint, lock, logger, method-override, mock-request, null-logger, runtime, sendfile, show-exceptions, show-status, tempfile-reaper and urlmap.

trails#9253 (merged after this story was filed) retyped every rack middleware's `app` as
`RackApp | { call: RackApp }` and deliberately KEPT `rbFSend(app, "call", env)`, because a bare
`app.call(env)` on a plain-function `RackApp` is `Function.prototype.call`, binding `env` as
`this` and passing no argument. Converging therefore needs a repo-level decision first: either
`RackApp` stops admitting a bare function (every middleware lambda in the repo becomes
`{ call }`), or the `rbFSend` stays as the settled shape and this story closes. That choice is
the repo owner's.

## Acceptance criteria

- Each site is spelled `app.call(env)`. `RackApp` becomes a callable-object type `{ call(env) }`, with a plain function accepted the way Ruby's Proc#call is.
- `pnpm parity:api:sends` shows a lower count for every rack file touched.
- The rack tests are green.
