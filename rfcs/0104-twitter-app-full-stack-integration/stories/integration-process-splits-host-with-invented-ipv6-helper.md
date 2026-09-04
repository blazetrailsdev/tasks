---
title: "Integration::Session#process splits host with an invented IPv6 helper"
status: ready
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Integration::Session#process` splits the host into `SERVER_NAME` /
`SERVER_PORT` with one line
(`actionpack/lib/action_dispatch/testing/integration.rb:246`):

```ruby
hostname, port = host.split(":")
```

`packages/actionpack/src/action-dispatch/testing/integration.ts` instead calls
a module-private `splitHostPort()` that brackets IPv6 literals, counts colons,
and returns `[host, undefined]` for an unbracketed multi-colon host. It is a
trails invention with no Ruby counterpart — Rails' `String#split(":")` on
`"::1"` yields `["", "", "1"]`, so `hostname` is `""` and `port` is `""`, and
Rails simply does not special-case IPv6 here.

The divergence has a visible consequence. PR #7468 converged `#process` onto
`Rack::Test::Session`, which parses the URI that `build_full_uri`
(`integration.rb:322-324`) produces. For an unbracketed IPv6 host that URI is
`http://::1:80/...`, which Ruby's `URI.parse` rejects and JS's `new URL`
rejects too — so the trails-only test
`correctly handles unbracketed IPv6 address as SERVER_NAME with no port` was
deleted in that PR rather than kept green against invented behaviour. The two
bracketed IPv6 tests still pass and are untouched.

`splitHostPort` is called from `#process` only (`integration.ts`), and is
module-private, so it does not show up in `parity:api:extra`.

## Converged shape

Replace `splitHostPort` with Rails' `host.split(":")` semantics at the call
site, and delete the helper. Decide, with the vendored source in front of you,
what the two bracketed-IPv6 tests should assert once the port matches Rails —
Rails' own behaviour for `host! "[::1]:3000"` is
`"[::1]:3000".split(":")` -> `hostname == "[", port == ""`, i.e. Rails does not
support a bracketed IPv6 host here either. If the conclusion is that the
bracketed tests are asserting invented behaviour too, they go with the helper;
say so explicitly in the PR rather than keeping the helper to keep them green.

## Acceptance criteria

- [ ] `splitHostPort` is gone from
      `packages/actionpack/src/action-dispatch/testing/integration.ts`.
- [ ] `#process` splits the host exactly as `integration.rb:246` does.
- [ ] The IPv6 tests either assert Rails' actual behaviour or are removed, with
      the reasoning stated in the PR body.
