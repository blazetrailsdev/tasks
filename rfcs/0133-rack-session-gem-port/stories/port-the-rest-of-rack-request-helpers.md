---
title: "Move the rest of Rack::Request::Helpers' members out of the Request class body into the mixin"
status: draft
updated: 2026-09-01
rfc: "0133-rack-session-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #7329 created `Rack::Request::Helpers` in `packages/rack/src/request.ts`
as a class module, but moved only one member into it — `ssl?`
(`vendor/rack/lib/rack/request.rb:410-412`) — because that was the member
`ActionDispatch::Request` was re-declaring divergently.

Everything else `Rack::Request::Helpers` defines (`request.rb:149-664`) still
lives inline in the `Rack::Request` class body: `request_method`, `scheme`,
`authority`, `host`, `port`, `path`, `full_path`, `url`, `base_url`,
`params`/`GET`/`POST`, `cookies`, `media_type`, `content_charset`, `ip`,
`forwarded_*`, `session`, `session_options`, `trusted_proxy?`, the whole
module. So the file models `Rack::Request`'s own body and the module it
includes (`request.rb:37`) as one flat class.

Consequence: `ActionDispatch::Request`, which gets all of these from
`include Rack::Request::Helpers`
(`vendor/rails/actionpack/lib/action_dispatch/http/request.rb:21`), can only
reach `ssl?` through the mixin. Every other member it needs is either
re-declared in `packages/actionpack/src/action-dispatch/http/request.ts` or
absent — and a re-declaration is exactly the divergence
`converge-actiondispatch-request-ssl-to-rack-helpers` was filed to fix, one
member at a time.

## Converged shape

The members `request.rb:149-664` defines live in the `Helpers` class module in
`packages/rack/src/request.ts`, in Rails' order, with `Rack::Request` keeping
only what `request.rb:22-114` declares outside the module (`Env`,
`initialize`, `params`-cache plumbing). `ActionDispatch::Request` then answers
them through the `include()` it already takes.

Sized as one sweep, but it can ship member-group by member-group (URL group,
params group, forwarded group) if that reads better — each move is
mechanical, since the bodies already exist and only change host.

## Acceptance criteria

- `Rack::Request::Helpers` in `packages/rack/src/request.ts` holds the members
  `request.rb:149-664` defines; `Rack::Request`'s class body holds only what
  `request.rb` declares outside the module.
- `packages/rack/src/request.ts`'s JSDoc no longer says "only the members
  ported out of the class body so far live here".
- `pnpm parity:api --package rack` shows no regression on `request.rb`
  (98% at time of filing) and `parity:api:calls` / `:args` / `:params` gain no
  rows.
