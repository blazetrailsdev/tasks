---
title: "handleOptions defaults sameSite from a jar-wide option where Rails reads request.cookies_same_site_protection"
status: draft
updated: 2026-09-07
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`CookieJar#handle_options` defaults `:same_site` from the **request**, not from
jar construction:

```ruby
unless options.key?(:same_site)
  options[:same_site] = request.cookies_same_site_protection
end
# vendor/rails/actionpack/lib/action_dispatch/middleware/cookies.rb:459-461
```

`request.cookies_same_site_protection` is `cookies.rb:74`, reading
`COOKIES_SAME_SITE_PROTECTION` (`"action_dispatch.cookies_same_site_protection"`,
`cookies.rb:209`) out of the request env.

trails' `handleOptions`
(`packages/actionpack/src/action-dispatch/middleware/cookies.ts`) reads a
jar-wide field instead:

```ts
if (!("sameSite" in options)) {
  options.sameSite = this._options.sameSite;
}
```

The guard shape is right; the **value source** is not. `_options.sameSite` is
seeded once at `CookieJar.build` time from `req?.cookiesAppOptions`, so a
per-request `action_dispatch.cookies_same_site_protection` — including a lambda,
which Rails supports since the env value is `call`ed — never reaches the jar.

The accessor is already ported and unused from here:
`cookiesSameSiteProtection` at `cookies.ts:559` (the `requestEnvAccessor`) and
`Request.prototype.cookiesSameSiteProtection` at `http/request.ts:989`.
`session/cookie-store.ts:55-56` already calls it the Rails way, so this jar is
the odd one out.

Surfaced while shipping `drop-dead-non-rails-cookiejaroptions-fields` (#7585),
which burnt `CookieJarOptions` down to `sameSite` plus the three secrets.
`sameSite` is the last non-Rails field on it, and it survived that PR only
because removing it needs this call-site change too.

## Converged shape

`handleOptions` reads `this._request.cookiesSameSiteProtection()`, mirroring
`cookies.rb:460`. `sameSite` then leaves `CookieJarOptions` entirely, taking the
last non-secret field with it.

## Acceptance criteria

- [ ] `handleOptions` defaults `sameSite` from the request accessor, per
      `cookies.rb:459-461` — not from a jar-wide option.
- [ ] `sameSite` is gone from `CookieJarOptions`; no construction site passes it.
- [ ] A test pins that a per-request
      `action_dispatch.cookies_same_site_protection` reaches a cookie written by
      the jar, mirroring Rails' `cookies_test.rb` same-site cases.
- [ ] `pnpm parity:api` deltas non-negative; both call gates green with no new
      baseline rows.
