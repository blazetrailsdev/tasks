---
title: "Rack set_cookie_header attribute guards use JS truthiness, not Ruby's"
status: draft
updated: 2026-09-30
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby Rack's `set_cookie_header` (`vendor/rack/v3.1.14/lib/rack/utils.rb:298-303`) guards every
attribute with Ruby truthiness — false only for `nil`/`false`:

```ruby
domain  = "; domain=#{value[:domain]}"   if value[:domain]
path    = "; path=#{value[:path]}"       if value[:path]
max_age = "; max-age=#{value[:max_age]}" if value[:max_age]
expires = "; expires=#{value[:expires].httpdate}" if value[:expires]
secure = "; secure"  if value[:secure]
```

trails' port (`packages/rack/src/utils.ts`, `setCookieHeader`, ~lines 304-310) diverges both ways:

- `if (opts.maxAge !== undefined)` emits `; max-age=null` for `maxAge: null` (Ruby: omitted) and
  `; max-age=false` for `false` (Ruby: omitted).
- `if (opts.domain)` / `if (opts.path)` / `if (opts.expires)` / `if (opts.secure)` are JS
  truthiness, so `domain: ""` / `path: ""` are dropped (Ruby emits `; domain=` / `; path=`),
  and `maxAge: 0` is fine only because of the `!== undefined` shape.

Surfaced while converging the `same_site` arms in trails#8259.

## Converged shape

Each guard is `x != null && x !== false`, exactly Ruby's `if value[:k]`, including the
`httponly` / `http_only` arm and `partitioned` (`utils.rb:303,317`).

## Acceptance criteria

- [ ] `setCookieHeader` emits `max-age`, `domain`, `path`, `expires`, `secure`, `httponly`,
      `partitioned` exactly when Ruby's truthiness would.
- [ ] A `utils.trails.test.ts` case pins `maxAge: null` omitted and `domain: ""` emitted.
