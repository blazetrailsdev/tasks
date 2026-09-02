---
title: "Burn down ActionDispatch::Request's Omit list: delete every re-declaration Rails does not actually override"
status: in-progress
updated: 2026-09-02
rfc: "0133-rack-session-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: 13
pr: 7380
claim: "2026-09-02T02:16:41Z"
assignee: "converge-actiondispatch-request-omitted-helpers-members"
blocked-by: null
closed-reason: null
---

## Context

`port-the-rest-of-rack-request-helpers` (#7338) moved every member
`Rack::Request::Helpers` defines (`vendor/rack/lib/rack/request.rb:149-787`)
into the `Helpers` class module, so `ActionDispatch::Request` reaches them
through the `include Rack::Request::Helpers` it already takes
(`vendor/rails/actionpack/lib/action_dispatch/http/request.rb:21`).

Most of them never arrive. `ActionDispatch::Request` re-declares them in its
own class body, and a Ruby class body outranks an included module — which
`include()` faithfully preserves — so the interface merge at the bottom of
`packages/actionpack/src/action-dispatch/http/request.ts` omits 31 names:

    body, requestMethod, isGet, isHead, isPost, isPut, isPatch, isDelete,
    host, port, hostWithPort, serverPort, path, queryString, fullpath, url,
    contentType, mediaType, contentLength, userAgent, xhr, ip, params,
    session, sessionOptions, cookies, logger, GET, POST, formData,
    defaultSession

(`env`, `getHeader`, `setHeader` and `fetchHeader` are also omitted, but those
are `Rack::Request::Env`'s and are the host contract the mixin is written
against, not divergences.)

Each omission is one of two things, and only the first is legitimate:

1. **Rails really does override it.** `request.rb` defines its own
   `request_method` (`:145-152`), `content_length` (`:292-295`),
   `form_data?` (`:373-375`), `ip` (`:326-328`), `session` (`:382-384`),
   `GET`/`POST` (`:395-425`), `cookies` (`:442-444`) and the URL group it
   picks up from `ActionDispatch::Http::URL`. Those stay omitted — the
   override IS the port.
2. **Nothing in Rails overrides it**, and trails re-declared it anyway. Those
   are the rows to delete: the member should come from the mixin, and the
   class-body copy is a second, drifting implementation of a body that now
   exists once.

`converge-actiondispatch-request-ssl-to-rack-helpers` (#7329) and
`converge-actiondispatch-request-scheme-to-rack-helpers` (#7336) each retired
one row this way. This story is the rest of that burndown.

Two live examples the move already caught, as the shape to look for: `form_data?`
was spelled `isFormData`, a different JS name from the mixin's `formData`, so
`include()` installed Rack's body under `formData` and requests answered Rack's
version — including the "POST with no Content-Type" case ActionDispatch drops.
And `session_options`, which Rails inherits while overriding only
`session_options=` (`request.rb:390-392`), had no reader at all.

## Converged shape

Each name in the list above is either

- deleted from the `Omit<RequestHelpers, ...>` list AND from the class body,
  because Rails does not override it and the mixin's member is the port; or
- kept, with the class-body member carrying a `Mirrors` citation naming the
  `action_dispatch/http/request.rb` line that overrides it.

Nothing is kept on the strength of "the types differ" — a differing type is
the divergence, not a reason for one.

## Acceptance criteria

- Every remaining entry in the `Omit` list cites the
  `action_dispatch/http/request.rb` (or `http/url.rb`, `http/parameters.rb`)
  line that overrides it.
- `pnpm parity:api --package actiondispatch` does not regress on
  `http/request.rb` (97% at filing); `parity:api:calls` / `:args` / `:params`
  gain no rows.
- Ships in more than one PR if it does not fit the LOC ceiling — the URL
  group, the params group and the header group are independent.
