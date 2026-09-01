---
title: "Drop ActionDispatch::Request's re-declared scheme and inherit Rack::Request::Helpers' four-arm body"
status: done
updated: 2026-09-01
rfc: "0133-rack-session-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: 7336
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::Request` does not define `scheme`. It gets it from
`include Rack::Request::Helpers`
(`vendor/rails/actionpack/lib/action_dispatch/http/request.rb:21`), whose body
is

```ruby
def scheme
  if get_header(HTTPS) == 'on'
    'https'
  elsif get_header(HTTP_X_FORWARDED_SSL) == 'on'
    'https'
  elsif forwarded_scheme
    forwarded_scheme
  else
    get_header(RACK_URL_SCHEME)
  end
end
```

(`vendor/rack/lib/rack/request.rb:249-258`).

trails re-declares it at
`packages/actionpack/src/action-dispatch/http/request.ts:237-242`:

```ts
get scheme(): string {
  if (this.env["HTTP_X_FORWARDED_PROTO"]) {
    return (this.env["HTTP_X_FORWARDED_PROTO"] as string).split(",")[0].trim();
  }
  return (this.env["rack.url_scheme"] as string) || "http";
}
```

Three divergences follow:

- the `HTTPS` / `HTTP_X_FORWARDED_SSL` arms are missing, so a request behind a
  proxy setting either header answers the raw `rack.url_scheme`;
- `HTTP_X_FORWARDED_PROTO` is read directly rather than through
  `forwarded_scheme` (`request.rb:614-625`), which consults
  `Rack::Request.forwarded_priority` and `x_forwarded_proto_priority` and
  handles `Forwarded:` as well as the `X-Forwarded-*` family;
- the `|| "http"` fallback has no Rails counterpart — Ruby returns whatever
  `get_header(RACK_URL_SCHEME)` holds, `nil` included.

This is the same class of bug `converge-actiondispatch-request-ssl-to-rack-helpers`
(PR #7329) fixed for `ssl?`, on the method `ssl?` itself calls. It is
load-bearing: `#protocol`, `#ssl?` and every `url` / `base_url` read it.

`packages/rack/src/request.ts:238-249` already carries the correct four-arm
body, converged to Rails' `get_header` reads by PR #7329.

## Converged shape

`ActionDispatch::Request` stops declaring `scheme` and answers from
`Rack::Request::Helpers`, which it already `include()`s
(`packages/actionpack/src/action-dispatch/http/request.ts:1159`). That means
moving `scheme` — and the `forwarded_scheme` / `forwarded_priority` machinery
it calls — into the `Helpers` class module in `packages/rack/src/request.ts`,
which is what `port-the-rest-of-rack-request-helpers` does wholesale; this
story is the narrow version for the one member with a known-divergent
actionpack twin, and the two should not both be claimed.

Note `Omit<Helpers, "scheme">` in that file's interface merge
(`request.ts:1160`) exists only to let the local declaration win; it comes out
with the declaration.

## Acceptance criteria

- `packages/actionpack/src/action-dispatch/http/request.ts` no longer declares
  its own `scheme`, and the `Omit<..., "scheme">` in its `Helpers` interface
  merge is gone.
- An `ActionDispatch::Request` with `HTTPS=on` and one with
  `HTTP_X_FORWARDED_SSL=on` both answer `scheme === "https"` — the arms that
  are missing today — with tests pinning them.
- `#protocol`, `#ssl` and the `url` / `baseUrl` readers are unchanged for a
  plain `http` and a plain `https` request.
- `pnpm parity:api --package actionpack` shows no regression and no new call /
  arg / param rows.
