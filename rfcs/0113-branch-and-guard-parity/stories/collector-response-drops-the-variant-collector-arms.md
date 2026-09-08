---
title: "collector-response-drops-the-variant-collector-arms"
status: draft
updated: 2026-09-08
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionController::MimeResponds::Collector#response`
(`vendor/rails/actionpack/lib/action_controller/metal/mime_responds.rb:283-293`)
has three arms:

```ruby
def response
  response = @responses.fetch(format, @responses[Mime::ALL])
  if response.is_a?(VariantCollector) # `format.html.phone` - variant inline syntax
    response.variant
  elsif response.nil? || response.arity == 0 # `format.html` - just a format, call its block
    response
  else # `format.html{ |variant| variant.phone }` - variant block syntax
    variant_collector = VariantCollector.new(@variant)
    response.call(variant_collector) # call format block with variants collector
    variant_collector.variant
  end
end
```

`packages/actionpack/src/action-controller/metal/mime-responds.ts` ports only
the middle arm: `response` answers the handler the negotiation resolved, so
`format.html.phone` (inline variant syntax) and
`format.html { |variant| ... }` (variant block syntax) both fall through to the
plain-format arm. `VariantCollector` exists in the same file but the two arms
that build and read one do not. The `new` call the gate names is
`VariantCollector.new(@variant)` at `mime_responds.rb:289`, carried as a
`@missingRailsCall new — CONVERGEABLE <this story>` receipt on the getter.

Surfaced by `converge-respond-to-negotiate-format-and-mismatch-arms`, which
added the getter so `respond_to` could call it as Rails does
(`mime_responds.rb:225-226`).

## Acceptance criteria

- [ ] `Collector#response` reproduces all three arms of
      `mime_responds.rb:283-293`, including the `VariantCollector` construction
      and the `variant` read.
- [ ] `Collector#custom` stores a `VariantCollector` where no block was given,
      matching `mime_responds.rb:271-279`.
- [ ] The `@missingRailsCall new` receipt is deleted from the getter.
