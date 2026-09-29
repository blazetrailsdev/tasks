---
title: "RemoteIp::GetIp#calculate_ip reads env directly instead of @req.remote_addr/client_ip/x_forwarded_for"
status: in-progress
updated: 2026-09-29
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8241
claim: "2026-09-29T15:30:30Z"
assignee: "ar-new-project-fails-its-own-typecheck"
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::RemoteIp::GetIp#calculate_ip`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/remote_ip.rb:127-133`) reads
the three addresses through the Request's generated `ENV_METHODS` readers:

```ruby
remote_addr   = ips_from(@req.remote_addr).last
client_ips    = ips_from(@req.client_ip).reverse!
forwarded_ips = ips_from(@req.x_forwarded_for).reverse!
```

and the spoof message (`:151-153`) interpolates `@req.client_ip.inspect` /
`@req.x_forwarded_for.inspect`.

trails#8148 ported those readers (`remoteAddr`, `clientIp`, `xForwardedFor` on
`packages/actionpack/src/action-dispatch/http/request.ts`, generated from
`ENV_METHODS`), but `GetIp#calculateIp`
(`packages/actionpack/src/action-dispatch/middleware/remote-ip.ts:118-133`) still
reads `this.env["REMOTE_ADDR"]`, `this.env["HTTP_CLIENT_IP"]` and
`this.env["HTTP_X_FORWARDED_FOR"]` directly, and builds the spoof message with
`JSON.stringify(env[...] ?? null)` rather than `inspect`.

## Converged shape

- `GetIp` holds the request as `@req` (Rails' `initialize(req, check_ip, proxies)`,
  `remote_ip.rb:117-121`) and `calculateIp` calls `this.req.remoteAddr`,
  `this.req.clientIp`, `this.req.xForwardedFor`.
- The `IpSpoofAttackError` message interpolates `rbInspect(this.req.clientIp)` /
  `rbInspect(this.req.xForwardedFor)`, matching `:151-153` byte for byte.

## Acceptance criteria

- [ ] No `env["REMOTE_ADDR" | "HTTP_CLIENT_IP" | "HTTP_X_FORWARDED_FOR"]` read left in `remote-ip.ts`.
- [ ] Spoof message uses `inspect` (`nil` for an absent header, not `null`).
- [ ] `remote-ip` tests green; `pnpm parity:api:calls` non-increasing.
