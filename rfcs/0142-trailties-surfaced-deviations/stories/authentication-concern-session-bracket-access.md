---
title: "authentication generator concern indexes the session instead of awaiting session.set/delete"
status: draft
updated: 2026-11-20
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The authentication generator's `concerns/authentication.ts.tt`
(`packages/trailties/lib/generators/trails/authentication/templates/app/controllers/concerns/authentication.ts.tt:40-47`)
reads and writes the session by bracket index:
`this.session["return_to_after_authenticating"] = …`, `const url = this.session[…]` and `delete this.session[…]`.
`ActionDispatch::Request::Session` has no indexer. Its accessors are `get` / `set` / `delete`, and since trails#10434 they are async (`packages/actionpack/lib/action-dispatch/request/session.ts`). So the generated app's return-to URL is never stored in the real session and never read back.

Rails (`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/authentication/templates/app/controllers/concerns/authentication.rb.tt:32-39`):

```ruby
def request_authentication
  session[:return_to_after_authenticating] = request.url
  redirect_to new_session_path
end

def after_authentication_url
  session.delete(:return_to_after_authenticating) || root_url
end
```

## Acceptance criteria

- `requestAuthentication` does `await this.session.set("return_to_after_authenticating", this.request.url)`.
- `afterAuthenticationUrl` becomes async and returns `(await this.session.delete("return_to_after_authenticating")) ?? this.rootUrl()`, as Rails' `session.delete(...) || root_url` does. Its callers in the generated sessions and passwords controllers await it.
- A generator test asserts the rendered template text, and an app-level test checks the return-to round trip through a real session.
