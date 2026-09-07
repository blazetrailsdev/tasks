---
title: "CookieJarOptions carries five dead fields Rails has no counterpart for"
status: draft
updated: 2026-09-07
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`CookieJarOptions`
(`packages/actionpack/src/action-dispatch/middleware/cookies.ts`) carries a
jar-wide defaults surface Rails does not have:

```ts
export interface CookieJarOptions {
  secret?: string;
  signedSecret?: string;
  encryptedSecret?: string;
  sameSite?: "strict" | "lax" | "none" | null;
  secure?: boolean;
  httpOnly?: boolean;
  domain?: string;
  path?: string;
  expires?: CookieExpires;
}
```

After #7581 deleted the hand-rolled `formatSetCookie`, the only fields any
code reads are `sameSite` (once, in `handleOptions`) and the three secrets.
`secure`, `httpOnly`, `domain`, `path` and `expires` are now read nowhere —
`grep -n "_options\." cookies.ts` returns three lines, none of them these.

They are also not a Rails concept. Rails' per-request cookie defaults come
from `request.cookies_same_site_protection` and the `handle_options` body
(`vendor/rails/actionpack/lib/action_dispatch/middleware/cookies.rb:452-461`),
which defaults only `:path` and `:same_site` — there is no jar-wide
`secure`/`http_only`/`domain` config object anywhere in `cookies.rb`. The
three dead fields existed only so the deleted formatter could re-apply them
at serialization time, which is itself the behaviour #7581 removed as
non-Rails (Rack's `set_cookie_header`, `vendor/rack/lib/rack/utils.rb:294`,
applies no defaults of its own).

Surfaced in review of #7581; flagged there as non-blocking cleanup rather
than a parity gap, since removing public type fields is a change with its
own blast radius.

## Converged shape

Drop `secure`, `httpOnly`, `domain`, `path` and `expires` from
`CookieJarOptions`, keeping only what is read and what Rails has a
counterpart for. Check each removal against its construction sites first —
`CookieJar.build` passes `req?.cookiesAppOptions`, and
`COOKIES_APP_OPTIONS_KEY` may be seeded with these keys by a caller outside
this file.

## Acceptance criteria

- [ ] `CookieJarOptions` carries no field that nothing reads and Rails does
      not have.
- [ ] No construction site still passes a removed key.
- [ ] `pnpm parity:api --package actionpack` deltas non-negative;
      `parity:api:extra --package actionpack` does not grow.
- [ ] Rails' cookie tests still pass, with no test renamed or reworded.
