---
title: "The CSRF cookie envelope serializes the session id under publicId where Rails writes public_id"
status: draft
updated: 2026-09-07
rfc: "0113-branch-and-guard-parity"
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

`RequestForgeryProtection::CookieStore#store`
(`actionpack/lib/action_controller/metal/request_forgery_protection.rb:350-359`)
writes the CSRF token bound to the session id:

```ruby
request.cookie_jar.encrypted.permanent[@cookie_name] = {
  value: { token: csrf_token, session_id: request.session.id }.to_json,
  ...
```

and `#fetch` (`:339-347`) reads it back with
`value.dig("session_id", "public_id") == request.session.id_was&.public_id`.

The `"public_id"` key comes from serializing the `SessionId` object: it has no
`to_json` of its own, so ActiveSupport's `Object#as_json` returns
`instance_values`, i.e. `{"public_id" => ...}` from its `@public_id` ivar.

trails (ported in PR #7591,
`packages/actionpack/src/action-controller/metal/request-forgery-protection.ts:135-160`)
serializes with `JSON.stringify`, so the same object contributes its TS field
name: `SessionId#publicId` (`packages/rack-session/src/abstract/id.ts:26`)
yields `{"publicId": ...}`, and `fetch` digs `value.session_id?.publicId` to
match. The port round-trips with itself — the tests in
`request-forgery-protection.trails.test.ts` cover store → fetch, a mismatched
session id, and a non-JSON payload — but the payload is a **wire format**: a
cookie written by Rails is not readable by trails and vice versa.

This was a reasoned call at the time (the standard Ruby→TS field-name
translation, and the value comes from serializing the object as Rails does
rather than from a hand-built hash), disclosed in #7591's body. It is recorded
here so it is tracked debt rather than a settled decision.

## Converged shape

`SessionId` serializes as Rails serializes it — the key Rails' consumers read is
`public_id` — so the envelope `CookieStore` writes and reads is byte-compatible
with Rails'. The `fetch` side then digs `"session_id"` / `"public_id"` exactly as
`request_forgery_protection.rb:344` does.

## Acceptance criteria

- [ ] The encrypted CSRF cookie's JSON envelope carries
      `{"token": ..., "session_id": {"public_id": ...}}`.
- [ ] `CookieStore#fetch` digs Rails' two string keys.
- [ ] The decision is driven by how a `SessionId` serializes, not by
      hand-building the hash at the `store` call site — Rails passes the object.
- [ ] The three `CookieStore` tests in
      `request-forgery-protection.trails.test.ts` still pass, and one pins the
      envelope's key spelling.
