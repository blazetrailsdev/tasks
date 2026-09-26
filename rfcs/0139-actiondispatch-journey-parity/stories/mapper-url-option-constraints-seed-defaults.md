---
title: "Hash URL-option constraints never seed the route's defaults"
status: claimed
updated: 2026-09-26
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-09-26T03:47:03Z"
assignee: "mapper-url-option-constraints-seed-defaults"
blocked-by: null
closed-reason: null
---

## Context

Rails copies URL-option Hash constraints into the route's defaults, in two places:

- `Mapper#scope` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb:869-874`):
  `options[:defaults] = options[:constraints].select { |k, v| URL_OPTIONS.include?(k) && (String|Integer) }.merge(options[:defaults] || {})`
- `Mapping#initialize` (`mapper.rb:152-155`): `@defaults = Hash[options_constraints.find_all { URL_OPTIONS ... }].merge @defaults`

`URL_OPTIONS` is `[:protocol, :subdomain, :domain, :host, :port]`. This is why
`constraints: { subdomain: "api" }` also makes URL generation emit that subdomain.

trails' `Mapper#scope` and `Mapper#addRoute`
(`packages/actionpack/src/action-dispatch/routing/mapper.ts`) now merge Hash
constraints (trails#8126), but they never copy the URL-option keys into
`defaults`.

## Acceptance criteria

- `scope(constraints: { subdomain: "api" })` and `get ..., constraints: { host: "x" }`
  put the String/Integer `URL_OPTIONS` keys into the route's defaults, with
  explicit defaults winning, as at `mapper.rb:152-155,869-874`.
- A Rails test exercising it (e.g. the `url_for` subdomain/host constraint cases
  in `dispatch/routing_test.rb`) is ported.
