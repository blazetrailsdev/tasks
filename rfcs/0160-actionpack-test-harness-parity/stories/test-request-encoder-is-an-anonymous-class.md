---
title: "actionpack: TestRequest::ENCODER is an anonymous class, not an exported Encoder"
status: ready
updated: 2026-10-02
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8343. `ActionController::TestRequest::ENCODER` is an instance of an anonymous
class (`vendor/rails/v8.0.2/actionpack/lib/action_controller/test_case.rb:151-176`):

```ruby
ENCODER = Class.new do
  include Rack::Test::Utils
  def should_multipart?(params) … end
  public :build_multipart
  def content_type … end
end.new
```

trails declares a named `class Encoder` in
`packages/actionpack/src/action-controller/test-case.ts` and, since #8343, exports it together with
its merged `interface Encoder`. The export exists only because
`scripts/api-compare/extract-ts-api.ts` extracts exported classes; without it `should_multipart?`
was reported missing. `Encoder` is a public name Rails does not have.

## Converged shape

The TS extractor hosts the members of a class expression assigned to a static constant —
`static readonly ENCODER = new (class { … })()` — on a class named after the constant, the way the
Ruby extractor now hosts `CONST = Class.new do … end.new` on `TestRequest::ENCODER`. `test-case.ts`
then declares the encoder inline with no exported `Encoder`.

## Acceptance criteria

- [ ] No exported `Encoder` class or interface in `test-case.ts`.
- [ ] `test_case.rb` stays 60/60 in `pnpm parity:api --package actioncontroller`.
