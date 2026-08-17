---
title: "converge-response-cookies-onto-set-cookie-header"
status: done
updated: 2026-08-17
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6671
claim: "2026-08-17T21:52:58Z"
assignee: "converge-response-cookies-onto-set-cookie-header"
blocked-by: null
closed-reason: null
---

# Converge `Response#cookies` onto the `Set-Cookie` header

## Context

Left over from `converge-accessor-surfaced-call-set-rows-wave-2`, which
converged the other 28 rows of the Rack header-accessor cluster by making the
ported bodies call `getHeader` / `setHeader` / `hasHeader` / `fetchHeader`.

`ActionDispatch::Response#cookies` (actionpack/lib/action_dispatch/http/response.rb:418-430)
reads the response's own `Set-Cookie` header and parses it back into a
`name => value` hash:

```ruby
def cookies
  cookies = {}
  if header = get_header(SET_COOKIE)
    header = header.split("\n") if header.respond_to?(:to_str)
    header.each do |cookie|
      if pair = cookie.split(";").first
        key, value = pair.split("=").map { |v| Rack::Utils.unescape(v) }
        cookies[key] = value
      end
    end
  end
  cookies
end
```

trails' port (packages/actionpack/src/action-dispatch/http/response.ts:310-316)
iterates a private `_cookies` map instead:

```ts
get cookies(): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [name, opts] of this._cookies) {
    result[name] = opts.value;
  }
  return result;
}
```

So the reader never round-trips through the header, and a `Set-Cookie` written
by anything other than the `_cookies` map is invisible to it. This is a
structural divergence, not a header-accessor spelling one, which is why wave 2
did not fold it in.

The single remaining row of the cluster is
`scripts/api-compare/call-mismatches-exclude/actiondispatch/http/response.json`
`cookies | get_header`.

## Acceptance criteria

- [ ] `Response#cookies` reads `getHeader(SET_COOKIE)` and parses it, mirroring
      response.rb:418-430 line for line (including the `to_str` / array arms and
      `Rack::Utils.unescape`).
- [ ] The `cookies | get_header` row is deleted by hand from the exclude tree
      (no `--write` reseed) and `pnpm parity:api:calls` stays green.
