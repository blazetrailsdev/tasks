---
title: "Ruby raise Class, msg should pair with the TS throw new Class(msg)"
status: ready
updated: 2026-08-28
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# Ruby's `raise Class, msg` should pair with the TS `throw new Class(msg)`

## Context

Found while working `0108/converge-remaining-call-arg-shape-rows` (PR #6699).

Ruby's `raise SomeError, "message"` CONSTRUCTS the exception from the class and
the message without ever calling `new` — the raise form does the construction.
JavaScript has no such form: `throw new SomeError("message")` is the only
spelling. So every ported raise site carries one `new` call that its Ruby
counterpart does not, and the call-argument comparator pairs that surplus `new`
against whatever unrelated `new` the Ruby body does have.

Confirmed instances, each currently costing a permanent baseline row that can
never converge because the divergence is in the comparator, not the port:

- `activesupport/testing/deprecation.ts` — `testing/deprecation.rb:34` is
  `raise ArgumentError, "No deprecator given"`. The port's
  `throw new ArgumentError(...)` is scored against the `Regexp.new(...)` at
  `deprecation.rb:40` that the port's `new RegExp(...)` actually mirrors.
- `actiondispatch/http/mime-negotiation.ts` — `mime_negotiation.rb:96` is
  `raise ArgumentError, "request.variant must be set to a Symbol or an Array of
Symbols."`; the port's `throw new ArgumentError(msg)` is scored against the
  zero-argument `ActiveSupport::ArrayInquirer.new` at `mime_negotiation.rb:100`.
  (Compounded there by the reader/writer name collision that
  `pair-ruby-writer-with-ts-set-accessor-not-its-reader` covers.)
- `actioncontroller/metal/request-forgery-protection.ts` —
  `request_forgery_protection.rb:314` is
  `raise ActionController::InvalidAuthenticityToken, warning_message`; PR #6699
  converged the port to `throw new InvalidAuthenticityToken(this.warningMessage)`,
  which is the faithful shape and still reads as a surplus `new`.

## Converged shape

The Ruby extractor should record `raise SomeError, args...` as a `new` call on
`SomeError` with those arguments — which is what the raise form does — so the
ported `throw new SomeError(args...)` pairs with it directly and is scored on
its real arguments. `raise SomeError.new(args)` already emits a `new` and must
keep pairing the same way, so the two Ruby raise spellings converge on one
extracted shape.

Check `raise` with no message (`raise SomeError`) and the re-raise forms
(`raise` bare, `raise e`) do NOT synthesise a `new`.

## Acceptance criteria

- [ ] `raise SomeError, args...` in a Ruby body extracts as a `new` call on
      `SomeError` carrying those arguments; bare `raise` / `raise e` do not.
- [ ] The baseline rows above are DELETED by hand from their
      `call-mismatches-exclude` shards (only-shrink; no reseed), and any stale
      unreviewed marks tightened with `pnpm parity:api:calls:tighten`.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green; the
      change does not surface new rows elsewhere (re-run with
      `API_COMPARE_FORCE=1 pnpm parity:api --calls` and diff the artifact).

_Moved from RFC 0108 on 2026-08-18. 0108 is closing: it delivered its four named
done-conditions (exclude tree 1,637 -> 1,266 rows) and is finishing only the
stories already in flight. This one had not started, so it returns to 0025, the
parent tooling backlog, where the remaining call-gate false-positive classes
live. It is unchanged otherwise — the finding and its citations stand._
