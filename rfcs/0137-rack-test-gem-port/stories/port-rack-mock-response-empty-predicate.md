---
title: "Port MockResponse#empty? — the status-only override Rails has"
status: ready
updated: 2026-09-06
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 31
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rack::MockResponse#empty?` (`vendor/rack/lib/rack/mock_response.rb:68-70`) is:

```ruby
def empty?
  [201, 204, 304].include? status
end
```

It overrides `Rack::Response#empty?` (`vendor/rack/lib/rack/response.rb:156-158`,
`@block == nil && @body.empty?`) with a pure status check, because a MockResponse's
body has already been buffered into a String and `String#empty?` would answer a
different question.

`packages/rack/src/mock-response.ts` does not port it: the class inherits
`Response#isEmpty` (`packages/rack/src/response.ts`), which reads
`this._block === null && Array.isArray(this._body) && this._body.length === 0`.
Surfaced while converging `MockResponse#body` onto the buffered String in #7553 —
that PR made `body` a String, which is exactly the situation the Rails override
exists for, so the inherited reader is now answering against the list where Rails
answers against the status.

## Converged shape

Add the `isEmpty` override to `MockResponse`, mirroring `mock_response.rb:68-70` —
`[201, 204, 304].includes(this.status)` — beside `cookie`, in Rails' member order.

## Acceptance criteria

- [ ] `MockResponse#isEmpty` mirrors `mock_response.rb:68-70` and does not consult
      the body.
- [ ] `packages/rack/src/mock-response.test.ts` stays green with no test name
      reworded; `spec_mock_response.rb`'s coverage of `empty?` is credited if it
      exists.
- [ ] `pnpm parity:api` deltas non-negative; both call gates green.
