---
title: "DebugExceptions#renderForApiRequest invokes to_<format> on a plain body, not a helper that installs toJson/toXml"
status: ready
updated: 2026-09-26
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActionDispatch::DebugExceptions#render_for_api_request` (`actionpack/lib/action_dispatch/middleware/debug_exceptions.rb:92-103`):

```ruby
body = { status: ..., error: ..., exception: wrapper.exception_inspect, traces: wrapper.traces }
to_format = "to_#{content_type.to_sym}"
if content_type && body.respond_to?(to_format)
  formatted_body = body.public_send(to_format)
  format = content_type
else
  formatted_body = body.to_json
  format = Mime[:json]
end
```

`body` is a plain Hash. Whatever serializers ActiveSupport's core extensions have given `Hash` answer `respond_to?`: `to_json` (`active_support/core_ext/object/json.rb`) and `to_xml` (`active_support/core_ext/hash/conversions.rb`). A new Hash conversion is picked up with no change to the middleware.

trails, after blazetrailsdev/trails#7777, builds the body through `apiErrorBody` in `packages/actionpack/src/action-dispatch/middleware/debug-exceptions.ts`. That helper installs only `toJson`/`toXml` as non-enumerable methods, and the middleware looks up `to<Format>` on it. The lookup matches Rails, but the set of conversions is chosen by the middleware rather than by activesupport. The #7777 review flagged this as the remaining parity gap.

## Converged shape

- `@blazetrails/activesupport` exposes Hash's core-ext conversions as one lookup keyed by method name. For example, a `hashConversion(name)` returning `toJson`, `toXml`, `toQuery`, `toParam` or undefined, owned next to `hash-utils.ts`.
- `renderForApiRequest` keeps a plain object body, computes `to<Format>` from `contentType.symbol`, and invokes `hashConversion(toFormat)?.(body)` when present. Otherwise it uses JSON as `application/json`.
- `apiErrorBody` is deleted.

## Acceptance criteria

- No serializer list in `debug-exceptions.ts`.
- Adding a Hash conversion in activesupport makes it selectable by the matching Mime symbol with no actionpack change. Test that with a registered test-only mime and conversion.
- Rails-named `rescue with XML format for XML API requests` and `rescue with JSON format as fallback if API request format is not supported` still pass.

## Definition of done

`debug-exceptions.ts` imports no individual serializer.

## Verification

`pnpm vitest run packages/actionpack/src/action-dispatch/dispatch/debug-exceptions`
