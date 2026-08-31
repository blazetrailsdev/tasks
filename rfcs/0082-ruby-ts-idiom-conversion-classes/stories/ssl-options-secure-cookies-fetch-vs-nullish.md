---
title: "ssl_options.fetch(:secure_cookies, true) is ported as a nullish coalesce"
status: draft
updated: 2026-08-31
rfc: "0082-ruby-ts-idiom-conversion-classes"
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

`DefaultMiddlewareStack#buildStack` reads Rails'
`config.ssl_options.fetch(:secure_cookies, true)`
(`vendor/rails/railties/lib/rails/application/default_middleware_stack.rb:77`)
as a JS nullish coalesce:

```ts
// packages/trailties/src/application/default-middleware-stack.ts
if (
  config.forceSsl &&
  (config.sslOptions.secureCookies ?? true) &&
  !("secure" in config.sessionOptions)
) {
```

These differ exactly where it matters. Ruby's `Hash#fetch(key, default)`
returns the STORED value whenever the key exists — including a stored `nil` or
`false` — and substitutes the default only when the key is ABSENT. JS `??`
substitutes the default for `null`/`undefined` regardless of whether the
property was set.

So an app that writes `config.ssl_options = { secure_cookies: nil }` gets
`nil` (falsy, cookies not forced secure) in Rails and `true` (forced) in
trails. `SslOptions.secureCookies` is typed `boolean | undefined`, so the
explicit-`null` arm is reachable from untyped config today.

This is the `fetch` vs `??` conversion class named in CLAUDE.md's "Ruby idioms
that do not translate literally" and enumerated by this RFC.

Noticed while porting `config.session_store` into the same `if` (PR #7295);
left alone there because it is a pre-existing line the PR did not otherwise
touch.

## Converged shape

Read the key's presence, not its nullishness — the JS spelling of `fetch` with
a default:

```ts
const secureCookies = "secureCookies" in config.sslOptions ? config.sslOptions.secureCookies : true;
```

and widen `SslOptions["secureCookies"]` to admit the stored-`null` arm if the
type is what makes the divergence unreachable in typed callers.

## Acceptance criteria

- `secure_cookies` resolves by key presence, matching `Hash#fetch`.
- A test covers a stored falsy `secureCookies` leaving `sessionOptions.secure`
  unset, alongside the existing absent-key case.
