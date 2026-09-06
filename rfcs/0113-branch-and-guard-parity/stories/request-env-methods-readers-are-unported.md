---
title: "request-env-methods-readers-are-unported"
status: draft
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
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

`ActionDispatch::Request` generates ~15 zero-arg env readers by metaprogramming
(`vendor/rails/actionpack/lib/action_dispatch/http/request.rb:33-53`):

```ruby
ENV_METHODS = %w[ ... HTTP_X_CSRF_TOKEN HTTP_X_REQUEST_ID HTTP_X_FORWARDED_HOST ].freeze

ENV_METHODS.each do |env|
  class_eval <<-METHOD, __FILE__, __LINE__ + 1
    def #{env.delete_prefix("HTTP_").downcase}   # def accept_charset
      get_header "#{env}"                        #   get_header "HTTP_ACCEPT_CHARSET"
    end                                          # end
  METHOD
end
```

trails ports none of them. `packages/actionpack/src/action-dispatch/http/request.ts`
has a `CGI_VARIABLES` set (Rack's, for `envName`) but no `ENV_METHODS` list and
no generated readers, so `xForwardedHost`, `acceptCharset`, `clientIp`,
`xRequestId` and the rest are absent.

The consequence is that every Rails body calling one of them inlines the header
read instead. `Http::URL#raw_host_with_port` (`url.rb:217`) is
`if forwarded = x_forwarded_host.presence`; the trails port
(`request.ts:222-232`) reads
`(this.env["HTTP_X_FORWARDED_HOST"] as string | undefined)?.trim()` — a raw env
read where Rails calls a method, and `?.trim()` where Rails calls `presence`.
`HostAuthorization` has the same shape at `host_authorization.rb:157`
(`request.x_forwarded_host&.split(/,\s?/)&.last`).

Surfaced in review of PR #7557, which converged the sibling half of that same
line — `#{server_name}` — onto `this.serverName` (Rack's `server_name`,
`vendor/rack/lib/rack/request.rb:285`, reachable through
`include(Request, RequestHelpers)`). `x_forwarded_host` had no such method to
call, which is this story.

## Converged shape

- An `ENV_METHODS` list mirroring `request.rb:33-47`, and the readers it
  generates, named by the same rule (`delete_prefix("HTTP_").downcase`,
  camelCased) — `HTTP_X_FORWARDED_HOST` → `xForwardedHost`.
- Callers stop reading `env[...]` directly: `rawHostWithPort` becomes
  `xForwardedHost.presence` (the ActiveSupport `presence`, not `?.trim()`), and
  `HostAuthorization`'s `forwardedHost` follows `:157`.
- The generated readers are properties, per CLAUDE.md's
  "Generated attribute readers are properties" section, since a Ruby zero-arg
  reader ports as an accessor.

## Acceptance criteria

- [ ] `ENV_METHODS` and its generated readers exist and mirror
      `request.rb:33-53`.
- [ ] `rawHostWithPort` and `HostAuthorization` call `xForwardedHost` rather
      than reading `env["HTTP_X_FORWARDED_HOST"]`, and use `presence`.
- [ ] `pnpm parity:api` deltas non-negative; `pnpm parity:api:extra:gate` green.
