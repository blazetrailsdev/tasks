---
title: "IntegrationTest#followRedirectBang diverges from follow_redirect!; invented redirectUrl getter (~120 LOC)"
status: done
updated: 2026-10-02
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8399
claim: "2026-10-02T14:02:12Z"
assignee: "arel-remaining-nil-sends-read-ruby-compat-is-nil"
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::Integration::RequestHelpers#follow_redirect!`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/testing/integration.rb:65-81`)
is:

```ruby
def follow_redirect!(headers: {}, **args)
  raise "not a redirect! #{status} #{status_message}" unless redirect?

  method =
    if [307, 308].include?(response.status)
      request.method.downcase
    else
      :get
    end

  if [ :HTTP_REFERER, "HTTP_REFERER" ].none? { |key| headers.key? key }
    headers["HTTP_REFERER"] = request.url
  end

  public_send(method, response.location, headers: headers, **args)
  status
end
```

trails' `followRedirectBang`
(`packages/actionpack/src/action-dispatch/testing/integration.ts`) diverges in
four places, found while reviewing trails PR 8370:

- It reads the target from an invented `get redirectUrl()` on `IntegrationTest`
  (`this.response?.getHeader("location") ?? this.controller?.headers.get("location")`),
  where Rails reads `response.location`. `Session` has no `redirect_url`
  (`integration.rb:97` delegates only `status`, `status_message`, `headers`,
  `body`, `redirect?`), and the controller fallback has no counterpart.
- It raises an extra `"not a redirect! (no Location header)"` Rails does not.
- The referer test also matches a lower-cased `referer` key, and the referer is
  rebuilt by hand from `rack.url_scheme` / `HTTP_HOST` / `PATH_INFO` /
  `QUERY_STRING`, where Rails assigns `request.url`.
- It dispatches through `this.process(method, …)`, where Rails `public_send`s
  the verb helper, and it reads the verb from `env.REQUEST_METHOD` rather than
  `request.method`.

`get status()` beside it has the same controller fallback
(`this.response?.statusCode ?? this.controller?.status ?? 0`), where
`integration.rb:97` is a plain `allow_nil` delegation to `response`.

## Acceptance criteria

- [ ] `followRedirectBang` is line-for-line `follow_redirect!`: the one raise,
      `request.method`, the two-key referer test, `request.url`, and a
      `rbFPublicSend` of the verb with `response.location`.
- [ ] `IntegrationTest#redirectUrl` is removed; callers read
      `response.location` or `response.redirectUrl`.
- [ ] `status` delegates to `response` with `allow_nil`, with no controller
      fallback.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green with no new
      baseline row.
