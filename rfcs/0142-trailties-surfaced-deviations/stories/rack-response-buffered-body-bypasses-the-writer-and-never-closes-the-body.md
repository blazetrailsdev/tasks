---
title: "rack: Response#buffered_body! bypasses @writer, never closes the body, and has an arm Rack lacks"
status: draft
updated: 2026-10-07
rfc: "0142-trailties-surfaced-deviations"
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

`Rack::Response#buffered_body!` (`vendor/rack/v3.1.14/lib/rack/response.rb:332-354`) has three
arms: `@body.is_a?(Array)`, `@body.respond_to?(:each)`, and `else`. Its `each` arm is

    body.each do |part|
      @writer.call(part.to_s)
    end

    body.close if body.respond_to?(:close)

The port (`packages/rack/src/response.ts`, `bufferedBodyBang`) differs in three ways, all found
while fixing byte parts in trails#8634:

- it calls `this.append(...)` directly where Rack calls `@writer.call(...)`, so a writer
  installed by `finish`'s block (`response.rb`, `each`) is bypassed while buffering;
- it never calls `body.close`, so a buffered `Rack::Files::Iterator` or `BodyProxy` is not
  closed;
- it has a fourth arm, `typeof this._body[Symbol.iterator] === "function"`, that Rack does not
  have.

## Acceptance criteria

- [ ] The `each` arm calls the writer with `toS(part)` and then closes the old body when it
      responds to `close`, as `response.rb:345-349` does.
- [ ] The `Symbol.iterator` arm is folded into the `each` arm or removed, so the method has
      Rack's three arms.
- [ ] A test buffers a body that records `close` and asserts it was closed once.
