---
title: "converge-request-method-onto-methodoverride-original-method"
status: done
updated: 2026-08-17
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6670
claim: "2026-08-17T21:28:00Z"
assignee: "converge-request-method-onto-methodoverride-original-method"
blocked-by: null
closed-reason: null
---

# `Request#method` reads the wrong env key (and inverts `request_method`)

## Context

Surfaced in `converge-accessor-surfaced-call-set-rows-wave-2` while converging
the Rack header-accessor cluster onto `getHeader` / `setHeader` / `hasHeader`.

Rails (actionpack/lib/action_dispatch/http/request.rb:212-221):

```ruby
def method(*args)
  if args.empty?
    @method ||= check_method(
      get_header("rack.methodoverride.original_method") ||
      get_header("REQUEST_METHOD")
    )
  else
    super
  end
end
```

`method` is the ORIGINAL HTTP method — the one before `Rack::MethodOverride`
rewrote `REQUEST_METHOD` — which is why it reads
`rack.methodoverride.original_method` first. `request_method`
(request.rb:145-152) is the possibly-overridden one.

trails has the two inverted
(packages/actionpack/src/action-dispatch/http/request.ts):

```ts
get method(): string {
  if (this.requestMethod === "POST") {
    const override =
      (this.getHeader("HTTP_X_HTTP_METHOD_OVERRIDE") as string) ?? this.params?.["_method"];
    ...
  }
  return this.requestMethod;
}
```

i.e. `method` APPLIES an override that trails performs inline (reading
`HTTP_X_HTTP_METHOD_OVERRIDE` / `_method` directly) rather than in a
`Rack::MethodOverride` middleware, and `requestMethod` returns the raw
`REQUEST_METHOD`. Neither method's memoization (`@method ||=`), `check_method`
call, nor `*args`/`super` arm is ported.

The residual call-argument row is
`scripts/api-compare/call-mismatches-exclude/actiondispatch/http/request.json`
`method | get_header(str:rack.methodoverride.original_method)`.

## Acceptance criteria

- [ ] `method` and `request_method` carry Rails' meanings: `method` is the
      pre-override method read from `rack.methodoverride.original_method` ||
      `REQUEST_METHOD`, memoized and run through `check_method`;
      `request_method` is the effective one (request.rb:145-152, :212-221).
- [ ] Whatever performs the override does so where Rails does, not inside
      `method`.
- [ ] The `method | get_header(str:rack.methodoverride.original_method)` row is
      deleted by hand (no `--write` reseed) and both call gates stay green.
