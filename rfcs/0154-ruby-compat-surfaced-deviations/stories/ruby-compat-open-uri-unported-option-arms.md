---
title: "OpenURI: port or fail loud on proxy, TLS, timeout and encoding options"
status: draft
updated: 2026-10-28
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9396 ported `OpenURI.open_uri` / `open_loop` / `open_http` (`vendor/ruby/v3.3.11/lib/open-uri.rb:133-378`) into `packages/ruby-compat/src/open-uri.ts` over `fetch`, because `Net::HTTP` is not ported. Several Rails-visible arms were dropped:

- the proxy scan in `open_loop` (`open-uri.rb:176-211`: `:proxy`, `:proxy_http_basic_authentication`, `find_proxy`)
- `open_http`'s TLS options (`:ssl_ca_cert`, `:ssl_verify_mode`, `:ssl_min_version`, `:ssl_max_version`, `open-uri.rb:303-323`)
- `:read_timeout` / `:open_timeout` (`:324-329`)
- the `rb`-mode / `:encoding` arm of `open_uri` (`:141-150`, `io.set_encoding`), plus `Meta#meta_setup_encoding` (`:472`)
- `URI::FTP#buffer_open` (`:776+`)

`check_options` accepts these options, but the port ignores them.

## Acceptance criteria

- Timeouts map onto `fetch` (`AbortSignal.timeout`) at their Ruby arms.
- The proxy and TLS options either reach a ported transport, or raise `NotImplementedError` naming the option instead of being silently ignored.
- The encoding arm is decided against CLAUDE.md § "A String has no encoding tag either".
- Each arm cites its open-uri.rb line.
