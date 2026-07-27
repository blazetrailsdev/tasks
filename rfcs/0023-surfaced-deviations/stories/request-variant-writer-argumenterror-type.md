---
title: "request-variant-writer-argumenterror-type"
status: draft
updated: 2026-07-27
rfc: "0023-surfaced-deviations"
cluster: null
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

Surfaced while converging the MimeNegotiation writers onto Rails-named
accessors (PR #5385). Left unchanged there on purpose: it is a behaviour
change unrelated to the shape convergence that PR was scoped to.

Rails raises `ArgumentError` when `request.variant=` is given anything other
than a Symbol or an Array of Symbols —
`vendor/rails/actionpack/lib/action_dispatch/http/mime_negotiation.rb:89`:

```ruby
def variant=(variant)
  variant = Array(variant)
  if variant.all?(Symbol)
    @variant = ActiveSupport::ArrayInquirer.new(variant)
  else
    raise ArgumentError, "request.variant must be set to a Symbol or an Array of Symbols."
  end
end
```

trails throws a bare `Error` with the right message but the wrong class, in
`packages/actionpack/src/action-dispatch/http/mime-negotiation.ts`
(`MimeNegotiation` class module, `set variant`). Callers cannot distinguish it
from any other failure.

There is repo precedent for this exact fix shape — see the done stories
`assert-valid-keys-argumenterror-type` and
`derive-fk-query-constraints-argumenterror-type`.

## Acceptance criteria

- `set variant` raises the ported `ArgumentError` analogue rather than bare
  `Error`, with the Rails message unchanged.
- The existing tests in
  `packages/actionpack/src/action-dispatch/dispatch/request.test.ts`
  ("setting variant to a non-symbol value", "setting variant to an array
  containing a non-symbol value") assert the error class, not just that it
  throws.
- No test names renamed.
