---
title: "Port Rack::Session::Cookie and its coder hierarchy, the largest single block of the gem's test suite"
status: draft
updated: 2026-08-31
rfc: "0000-rack-session-gem-port"
cluster: null
packages: ["rack-session"]
deps: ["relocate-rack-session-scaffolding-out-of-actionpack", "port-rack-session-encryptor"]
deps-rfc: []
est-loc: 650
priority: 7
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rack-session/lib/rack/session/cookie.rb` is 313 lines and 8 classes, 17
public methods. Its spec, `spec_session_cookie.rb`, is **48 tests — the largest
single block in the gem's 124-test suite**, and the reason this file is ported
rather than stubbed.

Nothing in trails calls it: Rails' `CookieStore` subclasses
`AbstractSecureStore`, not `Rack::Session::Cookie`
(`vendor/rails/actionpack/lib/action_dispatch/middleware/session/cookie_store.rb:52`).
That is not a reason to skip it. This package's contract is the **gem**,
measured by `parity:api` over the whole vendored `libPath` and by the gem's own
suite — so an unported file here is a measured gap, not an absent one. The
"only what trails calls" rule belongs to `ruby-compat` (RFC 0129) and does not
apply. See the RFC's Alternatives section.

Structure, with anchors:

| Ruby | line |
| --- | --- |
| `Cookie < Abstract::PersistedSecure` | `cookie.rb:91` |
| `Base64` + `Base64::Marshal` / `::JSON` / `::ZipJSON` | `:93`, `:103`, `:116`, `:127` |
| `Identity`, `Marshal` (legacy HMAC coders) | `:142`, `:147` |
| `initialize` | `:159` |
| `find_session` / `extract_session_id` / `unpacked_cookie_data` | `:203`, `:209`, `:213` |
| `persistent_session_id!`, `SessionId < DelegateClass(Session::SessionId)` | `:250`, `:256` |
| `write_session` / `delete_session` | `:265`, `:277` |
| `legacy_digest_match?` / `legacy_generate_hmac` / `encode_session_data` / `secure?` | `:282`, `:288`, `:292`, `:306` |

Note `cookie.rb:256` defines its **own** `SessionId` delegating
`Session::SessionId` — the same shape Rails' `cookie_store.rb:53` uses. Two
different delegate wrappers over one delegated class; keep them in their own
packages and do not merge them.

Dependencies are why this is step 6b: `cookie.rb:17-19` requires
`abstract/id`, `encryptor` and `constants`, so it needs both
`relocate-rack-session-scaffolding-out-of-actionpack` and
`port-rack-session-encryptor` landed.

`zlib` (`ZipJSON`, `:127-136`) is available — `packages/rack/src/deflater.ts:1`
imports it directly. `Marshal` is not, per
`packages/activesupport/src/messages/serializer-with-fallback.ts:11`; port
`Base64::Marshal` and `Marshal` as the JSON-backed shape that decision
prescribes and cite it, rather than adding a Marshal runtime.

**650 LOC is near the 700 ceiling.** If it does not fit, ship the coder
hierarchy (`:93-157`) first and file the store body as its own story with
`pnpm tasks new` — do not fan out PRs yourself.

Do not rename or reword a test name.

## Acceptance criteria

- `Rack::Session::Cookie` and all eight of its nested classes live in
  `packages/rack-session/src/cookie.ts`, each with a resolving
  `vendor/rack-session/lib/rack/session/cookie.rb:LINE` citation.
- `Cookie` extends the relocated `PersistedSecure` from
  `packages/rack-session/src/abstract/id.ts`, and `cookie.ts`'s `SessionId`
  delegate is distinct from actionpack's `CookieStore.SessionId`.
- The two Marshal coders follow the `serializer-with-fallback.ts` decision and
  cite it; no Marshal runtime is added.
- `packages/rack-session` still imports nothing from `@blazetrails/actionpack`.
- `pnpm parity:api` for `rack-session` improves by the 17 public methods;
  `parity:api:extra --package rack-session` reports no name the gem does not
  define; `parity:api:calls` / `:calls:args` / `:params` add no rows.
- actionpack deltas non-negative — no store there changes.
