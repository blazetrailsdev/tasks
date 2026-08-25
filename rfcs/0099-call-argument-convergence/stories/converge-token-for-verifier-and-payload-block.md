---
title: "Converge TokenDefinition#message_verifier lazy-init and #payload_for block receiver"
status: done
updated: 2026-08-12
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6415
claim: "2026-08-12T14:36:51Z"
assignee: "converge-remaining-marked-for-destruction-slot-reads"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #6409 while triaging the RFC 0099 extra-argument rows: four of
them sit in `token-for.ts` and are not mechanical receiver conversions — they
are behavioural divergences in `TokenDefinition`.

Rails (`vendor/rails/activerecord/lib/active_record/token_for.rb:19-26`):

```ruby
def message_verifier
  defining_class.generated_token_verifier
end

def payload_for(model)
  block ? [model.id, model.instance_eval(&block).as_json] : [model.id]
end
```

`generated_token_verifier` is a plain `class_attribute` reader; the verifier is
built once where the attribute is ASSIGNED (`token_for.rb`'s `included` block
plus the `generates_token_for` writer), never lazily inside
`message_verifier`.

trails (`packages/activerecord/src/token-for.ts:124-145`) instead:

- `messageVerifier()` builds a `MessageVerifier(resolveSecret())` on demand and
  assigns it back through `setGeneratedTokenVerifier(cls, …)` — a lazy-init
  Rails does not have, and the reason the call carries `ref:cls` where Rails
  passes nothing.
- `payloadFor(model)` calls `this.block(model)` and a local `asJson(...)`
  helper, where Rails is `model.instance_eval(&block).as_json` — the block
  runs in the MODEL's context in Ruby, so a definition block written as
  `generates_token_for(:x) { email }` (a bare receiver-less method call, which
  is how the Rails tests write it) reads the model, not an argument.

The corresponding call-argument rows are
`message_verifier`/`generated_token_verifier`, `payload_for`/`block`,
`payload_for`/`as_json` and `generate_token_for`/`token_definitions`.

## Converged shape

`messageVerifier()` is `this.definingClass.generatedTokenVerifier` with the
verifier constructed at assignment time (where Rails' `class_attribute`
default and the `generates_token_for` writer put it); `payloadFor` calls the
block with the model as its `this` receiver and routes the result through the
ActiveSupport `asJson`, matching token_for.rb:24.

## Acceptance criteria

1. `messageVerifier` reads the class attribute with no lazy construction,
   verified against token_for.rb:19-21; the verifier is built where Rails
   builds it.
2. `payloadFor` matches token_for.rb:24 including the block receiver.
3. The four `token-for.ts` rows are DELETED by hand from
   `call-mismatches-exclude/activerecord/token-for.json` (only-shrink; never
   `--write`).
4. `token-for.test.ts` and `token-for.trails.test.ts` green on all three
   adapter lanes; `parity:api:calls` / `:args` green.
