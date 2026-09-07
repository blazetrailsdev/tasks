---
title: "port-chained-cookie-jars-module-and-memoize-the-readers"
status: done
updated: 2026-09-07
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 7598
claim: "2026-09-07T19:26:54Z"
assignee: "port-chained-cookie-jars-module-and-memoize-the-readers"
blocked-by: null
closed-reason: null
---

## Context

Rails factors the four chained-jar readers onto one module that both
`CookieJar` and `AbstractCookieJar` include:

```ruby
module ChainedCookieJars
  def permanent
    @permanent ||= PermanentCookieJar.new(self)
  end

  def signed
    @signed ||= SignedKeyRotatingCookieJar.new(self)
  end

  def encrypted
    @encrypted ||= EncryptedKeyRotatingCookieJar.new(self)
  end

  def signed_or_encrypted
    @signed_or_encrypted ||=
      if request.secret_key_base.present?
        encrypted
      else
        signed
      end
  end
end
# actionpack/lib/action_dispatch/middleware/cookies.rb:225-268
```

`cookies.rb:506` is `class AbstractCookieJar; include ChainedCookieJars`, and
`:301` does the same on `CookieJar`, so a chained jar can itself be chained.

trails has no `ChainedCookieJars`. In
`packages/actionpack/src/action-dispatch/middleware/cookies.ts`:

- `permanent`, `signed`, `encrypted` and `signedOrEncrypted` are hand-written
  getters on `CookieJar`; PR #7595 moved `permanent` alone up to
  `AbstractCookieJar`, so the three chained jars now inherit it, but
  `signed` / `encrypted` / `signedOrEncrypted` still exist only on
  `CookieJar`.
- None of the four memoizes. Rails' `@x ||=` means `jar.signed.equal?(jar.signed)`;
  trails returns a fresh jar per read.
- The blocker for moving `signed` / `encrypted` up is the secret source:
  trails' getters read `this._options.signedSecret ?? this._options.secret`
  off `CookieJarOptions`, where Rails derives the verifier and encryptor from
  the request — `request.key_generator.generate_key(request.signed_cookie_salt)`
  (`cookies.rb:624-626`) and the `key_len` / `authenticated_encrypted_cookie_salt`
  branch at `:651-661`. `AbstractCookieJar` has no `_options`, only
  `request` (`cookies.rb:537`), which is exactly why Rails can share them.

Surfaced in review of PR #7595, which ported `AbstractCookieJar` and folded
the three chained jars' `[]=` bodies onto it.

## Converged shape

`ChainedCookieJars` as a mixin (`include()` / `Included<>` from
`@blazetrails/activesupport`, per CLAUDE.md's "Module mixins"), carrying all
four readers with Rails' `||=` memoization, mixed into both `CookieJar`
(`cookies.rb:301`) and `AbstractCookieJar` (`:506`). That requires the signed
and encrypted jars to derive their secrets from `request` per
`cookies.rb:624-626,651-661` rather than from `CookieJarOptions` — which also
retires the last two non-Rails fields on `CookieJarOptions`
(`signedSecret`, `encryptedSecret`, plus `secret`), finishing what
`drop-dead-non-rails-cookiejaroptions-fields` started.

`AbstractCookieJar#request` (`cookies.rb:537`, `@parent_jar.request`) is part
of this shape: it is how a chained jar reaches the request today in Rails.

## Acceptance criteria

- [ ] `ChainedCookieJars` exists with the four readers of `cookies.rb:225-268`,
      each memoized as Rails memoizes them.
- [ ] It is mixed into both `CookieJar` and `AbstractCookieJar`; no chained-jar
      reader is a hand-written getter on either any more.
- [ ] `SignedCookieJar` / `EncryptedCookieJar` take their secrets from the
      request per `cookies.rb:624-626,651-661`; `CookieJarOptions` loses its
      secret fields.
- [ ] `jar.signed` returns the same object on two reads, and `jar.signed.permanent`
      still round-trips (`middleware/cookies.test.ts`'s `SignedCookieJar#permanent`).
- [ ] `pnpm parity:api --package actionpack` deltas non-negative; both call
      gates green with no new baseline rows.
