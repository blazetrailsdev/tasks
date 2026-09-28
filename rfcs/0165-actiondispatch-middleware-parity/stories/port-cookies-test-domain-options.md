---
title: "Port cookies_test.rb's domain-option tests"
status: draft
updated: 2026-09-27
rfc: "0165-actiondispatch-middleware-parity"
cluster: null
packages: ["actionpack"]
deps: ["port-cookies-test-skips"]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

31 of `cookies_test.rb`'s 52 missing tests
(`vendor/rails/v8.0.2/actionpack/test/dispatch/cookies_test.rb`, Rails lines
1148-1404; `test_cookie_with_all_domain_option` is `:1204`) are about the
`domain:` option: `domain: :all` against non-standard,
Australian-style, UK-style and two-letter TLDs, subdomains, hosts with ports,
`localhost`, IPv4 and IPv6; the same with `tld_length`; deleting with
`domain: :all`; an array of preset domains (matching, subdomain, similar TLD,
similar domain, other, shared); `domain:` as a proc with and without the
request; and two upgrades just before them (a legacy HMAC AES-CBC cookie with a
64-byte key upgraded to authenticated encryption, and a hash-valued cookie not
modified by rotation).

`tld_length` is `ActionDispatch::Http::URL.tld_length`, which RFC 0164's
`http-config-seats-onto-mattr-accessor` seats.

## Acceptance criteria

- The 31 tests are ported in Rails order under `CookiesTest`.
