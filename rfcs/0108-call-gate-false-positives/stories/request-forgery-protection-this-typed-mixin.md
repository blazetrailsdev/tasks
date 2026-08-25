---
title: "request-forgery-protection-this-typed-mixin"
status: done
updated: 2026-08-18
rfc: "0108-call-gate-false-positives"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6703
claim: "2026-08-18T14:40:54Z"
assignee: "request-forgery-protection-this-typed-mixin"
blocked-by: null
closed-reason: null
---

# Move `request-forgery-protection.ts` onto the `this`-typed mixin idiom

## Context

Split out of `0108-call-gate-false-positives/converge-remaining-call-arg-shape-rows`
(PR #TBD, which converged the mime-negotiation rows and left this one).

`packages/actionpack/src/action-controller/metal/request-forgery-protection.ts`
ports Rails' `ActionController::RequestForgeryProtection` — a module `include`d
into the controller — as ~30 exported FREE FUNCTIONS that thread the controller
as an explicit first argument (`export function csrfTokenHmac(c: CsrfController,
session, identifier)`, `request-forgery-protection.ts:380`). Rails calls every
one of these on implicit `self`
(`actionpack/lib/action_controller/metal/request_forgery_protection.rb`), so every
internal call site diverges in argument shape. That is 12 `kind: "args"` shape
rows in `scripts/api-compare/call-mismatches-exclude/actioncontroller/metal/request-forgery-protection.json`,
all still carrying the RFC 0095 seed reason:

compare_with_global_token → global_csrf_token(session)
csrf_token_hmac → digest(constructor, realCsrfToken, identifier)
global_csrf_token → csrf_token_hmac(session, GLOBAL_CSRF_TOKEN_IDENTIFIER)
masked_authenticity_token → global_csrf_token(), normalize_action_path(action),
per_form_csrf_token(nil, actionPath, method)
normalize_action_path → normalize_relative_action_path(path)
request_authenticity_tokens → form_authenticity_param()
valid_authenticity_token? → compare_with_global_token(csrfToken),
compare_with_real_token(csrfToken), compare_with_real_token(maskedToken),
valid_per_form_csrf_token?(csrfToken)
valid_per_form_csrf_token? → per_form_csrf_token(session, chomp, requestMethod)

CLAUDE.md's settled answer for Ruby `include` is a `this`-typed function assigned
onto the class (see the "Module mixins" section, and
`action-dispatch/http/mime-negotiation.ts` for a file in this same package that
already uses it). Converting each `(c: CsrfController, ...)` to
`(this: CsrfController, ...)` drops the receiver from the argument list and makes
every internal call `foo.call(this, ...)`, matching Rails' shape.

Scope: ~30 signatures in the source file plus ~63 call sites across
`base.ts`, `action-controller/index.ts`, `action-dispatch/index.ts`,
`metal/request-forgery-protection.test.ts` (323 lines) and
`controller/request-forgery-protection.test.ts` (831 lines).

## Also in scope: the module's own `handle_unverified_request`

`request_forgery_protection.rb:401-409` is the module-level dispatcher:

    def handle_unverified_request
      protection_strategy = forgery_protection_strategy.new(self)

      if protection_strategy.respond_to?(:warning_message)
        protection_strategy.warning_message = unverified_request_warning_message
      end

      protection_strategy.handle_unverified_request
    end

It is not ported anywhere in the TS file — the three strategy classes define
`handleUnverifiedRequest` and nothing calls them, and
`unverifiedRequestWarningMessage` (request-forgery-protection.ts:307) is a free
function with no caller into a strategy. PR #6699 gave
`ProtectionMethods::Exception` its Rails `warning_message` accessor
(rb:307,314) so the raised `InvalidAuthenticityToken` carries the explanation,
but with no dispatcher to set it the field has no production writer yet. That
dispatcher is a module instance method taking implicit `self`, so it belongs to
this story rather than to a separate one.

## Acceptance criteria

- [ ] Every module member in `request-forgery-protection.ts` that Rails defines
      as an instance method takes `this: CsrfController` rather than a threaded
      first parameter, and is assigned onto the host per the CLAUDE.md mixin
      convention.
- [ ] All 12 seeded `kind: "args"` rows in
      `call-mismatches-exclude/actioncontroller/metal/request-forgery-protection.json`
      are DELETED by hand (only-shrink; no `--write` reseed), and the matching
      `call-mismatches-unreviewed` mark is tightened with
      `pnpm parity:api:calls:tighten`.
- [ ] `handle_unverified_request` (rb:401-409) is ported, so
      `Exception#warningMessage` is set from `unverifiedRequestWarningMessage`
      on the real request path and the Rails-named
      `raised exception message explains why it occurred` test can assert it
      end to end against the metal port.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green;
      actionpack tests pass.
