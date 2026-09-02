---
title: "converge-secure-random-provider"
status: done
updated: 2026-09-02
rfc: "0133-rack-session-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 18
pr: 7384
claim: "2026-09-02T12:03:27Z"
assignee: "add-rack-session-to-generate-stubs-pkg-dirs"
blocked-by: null
closed-reason: null
---

## Context

`Rack::Session::Abstract::ID::DEFAULT_OPTIONS[:secure_random]` is `::SecureRandom`
— the provider OBJECT, not a boolean
(`vendor/rack-session/lib/rack/session/abstract/id.rb:257`), and `generate_sid`
calls `secure.hex(@sid_length)` on it, falling back to the `Kernel.rand` arm when
that raises `NotImplementedError`
(`vendor/rack-session/lib/rack/session/abstract/id.rb:283-290`).

trails' port instead seats `secureRandom: true` in `DEFAULT_OPTIONS`
(`packages/rack-session/src/abstract/id.ts`) and hard-codes
`getCrypto().randomBytes(...)` in `generateSid`, so the `secure` parameter is
only ever read for truthiness and a caller-supplied provider is ignored.

Surfaced while porting `spec_session_abstract_id.rb` in
`enroll-rack-session-test-suite` (#PR). Three Ruby tests turn on this and are
`BLOCKED:`-skipped in the ported files until it converges:

- `spec_session_abstract_id.rb` "use securerandom" — asserts
  `DEFAULT_OPTIONS[:secure_random] == ::SecureRandom` and `id.sid_secure ==
::SecureRandom`.
- `spec_session_abstract_id.rb` "allow to use another securerandom provider" —
  passes a `secure_random:` object whose `hex` returns `'fake_hex'` and asserts
  `generate_sid` returns it.
- `spec_session_abstract_persisted.rb` "#generated_sid generates a session
  identifier" — its third arm passes an object whose `hex` raises
  `NotImplementedError` to exercise the rescue arm. It currently passes
  vacuously, because `generateSid` never calls `hex`.

## Acceptance criteria

- A `SecureRandom` analogue exposing `hex(n)` exists (Ruby stdlib surface, so
  `@blazetrails/ruby-compat` with its MRI citation, not activesupport), and
  `DEFAULT_OPTIONS.secureRandom` is that object rather than `true`.
- `generateSid(secure)` calls `secure.hex(this.sidLength)` and keeps the
  `NotImplementedError` → `generateSid(false)` rescue arm.
- The three `BLOCKED:` skips above are un-skipped and pass; `pnpm parity:test`
  credits three more rack-session tests.
- `pnpm parity:test:assertions` reports no new mismatch for rack-session.
