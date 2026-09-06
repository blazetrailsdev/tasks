---
title: "Request#port falls back to SERVER_PORT where Rails falls back to standard_port"
status: done
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 7
pr: 7557
claim: "2026-09-06T14:18:20Z"
assignee: "api-compare-pairs-a-ruby-predicate-and-instance-new-onto-one-ts-member"
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::Http::URL#port`
(`vendor/rails/actionpack/lib/action_dispatch/http/url.rb:255-261`):

```ruby
def port
  @port ||= if raw_host_with_port =~ /:(\d+)$/
    $1.to_i
  else
    standard_port
  end
end
```

The trails port
(`packages/actionpack/src/action-dispatch/http/request.ts:234-241`) diverges on
three counts:

```ts
get port(): number {
  const httpHost = this.env["HTTP_HOST"] as string | undefined;
  if (httpHost) {
    const match = httpHost.match(/:(\d+)$/);
    if (match) return parseInt(match[1], 10);
  }
  return parseInt((this.env["SERVER_PORT"] as string) || "80", 10);
}
```

1. **Wrong else arm.** Rails falls back to `standard_port`
   (`url.rb:265-271`), which is 443 for `https://` and 80 otherwise. trails
   reads `SERVER_PORT` and only defaults to `"80"` when that is absent — so a
   request with `rack.url_scheme` `https`, an `HTTP_HOST` carrying no port and
   a `SERVER_PORT` of `80` answers `80` where Rails answers `443`. trails
   already has the correct helper one method down: `standardPort`
   (`request.ts:243-245`).
2. **Wrong source.** Rails matches against `raw_host_with_port`
   (`url.rb:225-231`), which prefers `X-Forwarded-Host`'s last entry over
   `HTTP_HOST` and falls back to `"#{SERVER_NAME || SERVER_ADDR}:#{SERVER_PORT}"`.
   trails reads `env["HTTP_HOST"]` directly, so a forwarded host's port is
   invisible to it. `rawHostWithPort` may itself need porting — check before
   assuming it exists.
3. **No memo.** Rails memoizes with `@port ||=`; trails recomputes per read.
   Low stakes, but it is part of the body.

Surfaced by #7545 (`converge-hand-rolled-url-call-sites-onto-the-uri-port`).
That PR converged `ActionDispatch::TestRequest`'s `port` getter, which had
re-implemented this body verbatim, down to `return super.port;` — correct,
since `test_request.rb:28-45` defines only writers and inherits the reader. The
inherited reader is the one that is wrong, and fixing it there fixes both.

## Acceptance criteria

- [ ] `Request#port` mirrors `url.rb:255-261`: match `rawHostWithPort` against
      `/:(\d+)$/`, else `standardPort`, memoized as Rails memoizes.
- [ ] `rawHostWithPort` mirrors `url.rb:225-231` (forwarded host last entry,
      then `HTTP_HOST`, then `SERVER_NAME`/`SERVER_ADDR` + `SERVER_PORT`), or
      is ported if absent.
- [ ] A test covers the https-scheme / no-port-in-host case that today answers
      80 and should answer 443, and it fails on the pre-change body.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green; any
      baseline row that converges is deleted by hand.
