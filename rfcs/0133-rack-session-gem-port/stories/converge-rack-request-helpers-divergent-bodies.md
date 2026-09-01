---
title: "converge-rack-request-helpers-divergent-bodies"
status: draft
updated: 2026-09-01
rfc: "0133-rack-session-gem-port"
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

`port-the-rest-of-rack-request-helpers` (#7338) moved every member
`Rack::Request::Helpers` defines (`vendor/rack/lib/rack/request.rb:149-664`)
out of the `Rack::Request` class body and into the `Helpers` class module in
`packages/rack/src/request.ts`. That move was mechanical by design — bodies
changed host, not content — and it surfaced that a cluster of those bodies do
not mirror the Ruby they are now cited against.

`parity:api` scores `request.rb` at 98% and the call-set gate is green on all
of them, because both measure named members and method calls, not accessor
bodies. So none of this is caught today.

The divergences, each with its Ruby anchor:

- **The authority/host/port cluster.** `authority`
  (`request.rb:265-267`) is `forwarded_authority || host_authority ||
  server_authority`; trails computes `host:port` from the raw env.
  `host` (`request.rb:330-332`) is `split_authority(self.authority)[0]`;
  trails reads `HTTP_HOST` directly. `server_authority`
  (`request.rb:271-281`), `port` (`request.rb:342-348`) and `server_port`
  (`request.rb:287-289`, which returns the raw header where trails
  `parseInt`s it) all follow from those two. `host_with_port`
  (`request.rb:319-327`) takes an `authority = self.authority` parameter and
  compares its port against `DEFAULT_PORTS[scheme]`; trails has it as a bare
  alias for `authority`, and `DEFAULT_PORTS` (`request.rb:168`) is unported.
- **`ip` / `trusted_proxy?`.** Ruby routes both through
  `Rack::Request.ip_filter` (`request.rb:47-58`, `603-605`), and `ip`
  (`request.rb:410-427`) is four lines over `split_header`,
  `reject_trusted_ip_addresses` and `forwarded_for`. trails reads an invented
  `rack.request.trusted_proxy` env key that Rack has no notion of, hand-rolls
  the chain walk, and leaves `Request.ipFilter` permanently `null` and never
  read. `packages/rack/src/request.test.ts:1324-1390` pins the invented key,
  so those cases go with it.
- **`cookies`** (`request.rb:291-303`) memoizes one hash and `replace`s its
  contents in place from `Utils.parse_cookies_header`; trails parses into a
  fresh object each miss through a file-local `parseCookies`, never calling
  the ported `parseCookiesHeader` (`packages/rack/src/utils.ts:242`).
- **`GET` / `POST`** (`request.rb:479-491`, `497-539`): no
  `RACK_REQUEST_FORM_ERROR` arm, no `form_input.equal?(rack_input)` identity
  check, and `POST` does not route multipart pairs through
  `expand_param_pairs`.
- **`fullpath`** (`request.rb:591-593`) is
  `query_string.empty? ? path : "#{path}?#{query_string}"`; trails rebuilds
  the string from `script_name` and `path_info` rather than calling `path`.
- **`values_at`** (`request.rb:608-612`) lacks the deprecation `warn`.

## Acceptance criteria

- Each body listed above matches its Ruby line for line, calling what Rails
  calls; `DEFAULT_PORTS` and the default `ip_filter` lambda are ported.
- The invented `rack.request.trusted_proxy` env key is gone from
  `packages/rack/src/request.ts` and from the tests that pin it; trusted-proxy
  behaviour is configured through `Rack::Request.ip_filter`, as Rack does it.
- `parity:api --package rack` does not regress on `request.rb` (98% at filing);
  `parity:api:calls` / `:args` / `:params` gain no rows.
- Ships in more than one PR if it does not fit the LOC ceiling — the
  authority/host/port cluster, the `ip` cluster, and the params cluster are
  independent.
