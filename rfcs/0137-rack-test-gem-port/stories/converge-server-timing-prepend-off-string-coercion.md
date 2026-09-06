---
title: "Prepend the server-timing header value itself, not a String() coercion of it"
status: done
updated: 2026-09-06
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 24
pr: 7553
claim: "2026-09-06T13:05:18Z"
assignee: "converge-rack-conditional-get-to-rfc2822-guard"
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::ServerTiming#call`
(`vendor/rails/actionpack/lib/action_dispatch/middleware/server_timing.rb:70-73`)
prepends the existing header value onto the list it is about to join:

```ruby
if headers[ActionDispatch::Constants::SERVER_TIMING].present?
  header_info.prepend(headers[ActionDispatch::Constants::SERVER_TIMING])
end
headers[ActionDispatch::Constants::SERVER_TIMING] = header_info.join(", ")
```

`packages/actionpack/src/action-dispatch/middleware/server-timing.ts:76-80`
prepends `String(existing)` instead of the value itself. The `String(...)` was
added in #7529 when `RackResponse`'s header member widened to
`Record<string, string | string[]>` and `headerInfo` stayed `string[]`.

The two differ for an array value. Ruby's `Array#join` flattens nested arrays
with the SAME separator, so a `["a", "b"]` prepended into `header_info` and
joined with `", "` gives `"a, b, ..."`. `String(["a","b"])` gives `"a,b"` —
comma-joined with no space — which then lands in the output as a single element.
`server-timing` is single-valued on every live path, so nothing observes this
today.

## Converged shape

Type `headerInfo` as `Array<string | string[]>` and port Ruby's `join` semantics
for the nested case, or flatten the prepended value with the same separator, so
the coercion is not a silent `String()` at the prepend site. Ruby's
`.present?` is already correctly spelled `isPresent`.

## Acceptance criteria

- [ ] The prepend mirrors `server_timing.rb:71` — the header value itself, not a
      `String()` coercion of it.
- [ ] An array header value joins as Ruby's `Array#join` would, with the `", "`
      separator applied across the nested elements.
- [ ] `packages/actionpack/src/action-dispatch/middleware/server-timing.test.ts`
      stays green with no test name reworded.
- [ ] `pnpm parity:api` deltas non-negative; both call gates green.
