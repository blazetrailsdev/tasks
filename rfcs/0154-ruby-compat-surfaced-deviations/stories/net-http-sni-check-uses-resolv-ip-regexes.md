---
title: "net-http-sni-check-uses-resolv-ip-regexes"
status: draft
updated: 2026-11-06
rfc: "0154-ruby-compat-surfaced-deviations"
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

`Net::HTTP#connect` (`packages/ruby-compat/lib/net/http.ts`) ports Ruby's SNI
arm (`vendor/ruby/v3.3.11/lib/net/http.rb:1652-1667`):

```ruby
case @address
when Resolv::IPv4::Regex, Resolv::IPv6::Regex
  @ssl_context.verify_hostname = false
else
  ssl_host_address = @address
end
```

ruby-compat has no `Resolv`. trails#9804 tells an IP address from a hostname by
trying `new IPAddr(connAddr)` and catching the error. Ruby does no such thing,
and the two checks disagree on some inputs: `IPAddr` accepts `1.2.3.4/8` and
other forms that `Resolv::IPv4::Regex` rejects.

The Ruby regexes are `Resolv::IPv4::Regex256` / `Regex`
(`vendor/ruby/v3.3.11/lib/resolv.rb:2839-2843`) and `Resolv::IPv6::Regex`
(`resolv.rb:2972` and the following lines), plus `Resolv::AddressRegex`
(`:3388`).

## Acceptance criteria

- ruby-compat ports `Resolv::IPv4::Regex` and `Resolv::IPv6::Regex` from
  `resolv.rb`, under those names, with an MRI citation on each.
- `Net::HTTP#connect` decides with
  `Resolv.IPv4.Regex.test(addr) || Resolv.IPv6.Regex.test(addr)`, in the shape
  of Ruby's `case`, and the `IPAddr` try/catch is deleted.
- A test where a CIDR-shaped address (`1.2.3.4/8`) gets SNI set, as Ruby does.
