---
title: "converge-actioncontroller-metal-header-seat-onto-response"
status: draft
updated: 2026-09-01
rfc: "0129-ruby-compat"
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

Surfaced in review of PR #7366, which converged `ActionDispatch::Response`'s
header seat onto the ported `Rack::Headers`
(`packages/actionpack/src/action-dispatch/http/response.ts`). The same debt
exists one layer up, in `ActionController::Metal`, and #7366 deliberately left
it alone as out of scope.

Rails does not give `Metal` a header seat at all — it delegates:

```ruby
# Delegates to ActionDispatch::Response#headers.
delegate :headers, to: "@_response"
```

(`actionpack/lib/action_controller/metal.rb:179-180`). So a controller's
`headers` IS the response's `Rack::Headers`, a write through
`controller.headers["WWW-Authenticate"] = ...`
(`http_authentication.rb:140`, `:278`, `:557`) lands directly on the response,
and case-folding is the seat's property.

trails instead keeps a SECOND, independent seat on the controller:

- `packages/actionpack/src/action-controller/metal.ts:195` —
  `protected _headers: Record<string, string> = {}`.
- `:261` / `:266` — `setHeader` / `getHeader` downcase at each call site, the
  read-site fold #7366 deleted from `Response`.
- `:212-214` — `dispatch` copies the accumulated entries onto the response with
  `setHeader` after the action returns, so a header is not visible on the
  response until then.
- `:373-376` — `toRackResponse` spreads the controller's own `_headers` and
  splices `content-type` in, rather than asking the response.

The two seats are why `http-authentication.ts:97` and `:314` can still write
`controller.headers["WWW-Authenticate"] = ...` verbatim: they hit a plain
`Record`, not the response. That is the accident to remove, not the reason to
keep it.

## Acceptance criteria

- [ ] `ActionController::Metal#headers` delegates to the response
      (`metal.rb:179-180`); `Metal` carries no `_headers` seat of its own.
- [ ] `setHeader` / `getHeader` on the controller stop downcasing — the seat
      folds case, as it does on `Response` after #7366.
- [ ] `dispatch` no longer replays accumulated headers onto the response
      (`:212-214`), because there is nothing to replay.
- [ ] `toRackResponse` (`:373-376`) reads the response's headers rather than a
      private copy.
- [ ] `http-authentication.ts`'s `controller.headers[...] = ...` writes stay
      spelled as `http_authentication.rb:140/:278/:557` spell them, or the
      deviation is stated at the call site.
- [ ] `pnpm parity:api:calls` / `parity:api:calls:args` show no new rows; the
      actioncontroller and actiondispatch suites stay green.
