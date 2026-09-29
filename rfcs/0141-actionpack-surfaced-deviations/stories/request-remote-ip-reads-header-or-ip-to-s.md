---
title: "request-remote-ip-reads-header-or-ip-to-s"
status: draft
updated: 2026-09-29
rfc: "0141-actionpack-surfaced-deviations"
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

Rails' `ActionDispatch::Request#remote_ip`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/request.rb:312-314`) is

```ruby
def remote_ip
  @remote_ip ||= (get_header("action_dispatch.remote_ip") || ip).to_s
end
```

and `#ip` (`request.rb:306-308`) is `@ip ||= super`, i.e. `Rack::Request::Helpers#ip`
(`vendor/rack/v3.1.14/lib/rack/request.rb:414`), which walks `REMOTE_ADDR` and
`X-Forwarded-For` past trusted proxies.

trails' `get remoteIp` (`packages/actionpack/src/action-dispatch/http/request.ts:420-429`)
instead duck-types `.calculate()` on the header value, `String(v)`s anything else, and
falls back to `REMOTE_ADDR || "127.0.0.1"`. It has no `@remote_ip` memo, and it answers
`null` where Rails' `.to_s` answers `""`. `get ip` (`request.ts:436-438`) returns
`this.remoteIp` rather than Rack's `ip`, so the relationship is inverted.
`set remoteIp` does not clear the memo (`request.rb:316-319`), because there is none.

Surfaced in the trails#8241 review, after `GetIp` gained `toString()` → `calculate()`,
which is Rails' `GetIp#to_s` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/remote_ip.rb:171-173`).

## Acceptance criteria

- `remoteIp` is `(getHeader("action_dispatch.remote_ip") ?? this.ip)` converted with
  Ruby `to_s` semantics (`GetIp#toString`, `nil.to_s == ""`), memoized, and `setRemoteIp`
  / the setter clears the memo.
- `ip` ports `@ip ||= super` onto rack's `Request::Helpers#ip`.
- `remote-ip.test.ts` "returns null when no valid IP can be derived" is reconciled with
  Rails' `request_test.rb` remote-ip tests (e.g. "remote ip middleware not present still
  returns an IP", `request_test.rb:270`).
