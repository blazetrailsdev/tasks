---
title: "CookieStore drops the encrypted cookie jar, the session-id check and the store options"
status: draft
updated: 2026-08-31
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionController::RequestForgeryProtection::CookieStore`
(`vendor/rails/actionpack/lib/action_controller/metal/request_forgery_protection.rb:333-364`)
reads and writes an **encrypted** cookie jar and binds the token to the
session id:

```ruby
def fetch(request)
  contents = request.cookie_jar.encrypted[@cookie_name]
  return nil if contents.nil?

  value = JSON.parse(contents)
  return nil unless value.dig("session_id", "public_id") == request.session.id_was&.public_id

  value["token"]
rescue JSON::ParserError
  nil
end

def store(request, csrf_token)
  request.cookie_jar.encrypted.permanent[@cookie_name] = {
    value: { token: csrf_token, session_id: request.session.id }.to_json,
    httponly: true,
    same_site: :lax,
  }
end

def reset(request)
  request.cookie_jar.delete(@cookie_name)
end
```

`packages/actionpack/src/action-controller/metal/request-forgery-protection.ts`'s
`CookieStore` takes the request (converged in PR #7302) but stores the bare
token as a plain string in `request.cookies[this._cookieName]`. Three arms are
missing: the encrypted jar, the JSON envelope with its `session_id` /
`public_id` equality check and `JSON::ParserError` rescue, and the
`permanent` / `httponly` / `same_site: :lax` store options. `CsrfRequest`
(`request-forgery-protection.ts:234`) carries `cookies?: Record<string, string>`
where Rails has `request.cookie_jar`, so the type converges with the body.

The trails `CookieJar` with an `encrypted` accessor already exists at
`packages/actionpack/src/action-dispatch/middleware/cookies.ts`.

## Acceptance criteria

- `CookieStore#fetch` / `#store` / `#reset` go through the encrypted cookie jar
  and reproduce the JSON envelope, the session-id check, the `JSON::ParserError`
  rescue and the store options, in Rails' order.
- `CsrfRequest` names the slot after `request.cookie_jar`, not a string hash.
- No test renamed; `pnpm parity:api:calls` and `parity:api:calls:args` report no
  new row, and any baseline row this converges is deleted rather than reseeded.
