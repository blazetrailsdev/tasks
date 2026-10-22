---
title: "rack-response-type-admits-callable-hijack-header"
status: done
updated: 2026-10-22
rfc: "0177-actioncable-package-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9206
claim: "2026-10-22T01:58:36Z"
assignee: "rack-response-type-admits-callable-hijack-header"
blocked-by: null
closed-reason: null
---

## Context

Raised reviewing trails#9206. Rack allows a callable `rack.hijack` response header (`vendor/rack/v3.1.14/lib/rack/lint.rb:619-630`), and `Handler::Node` honours it on both paths (`packages/rack/src/handler/node.ts`). But the public `RackResponse` type (`packages/rack/src/index.ts:8`) types headers as `Record<string, string | string[]>`, so an app must cast its callback (`as unknown as string`, `packages/rack/src/handler/node.test.ts`). Widening the value type to admit `(stream) => unknown` was tried on trails#9206 and gave 34 TS errors: rack middleware (`auth/basic.ts`, `common-logger.ts`, `conditional-get.ts`, `etag.ts`, `lock.ts`, `recursive.ts`, ...) and actionpack (`content-security-policy.ts:60`, `permissions-policy.ts:41`, `cookies.ts:645`) re-declare the narrower tuple or pass headers to `string`-valued helpers.

## Acceptance criteria

- [ ] `RackResponse`'s header type admits a callable `rack.hijack` value, and every middleware that re-declares the tuple uses `RackResponse`.
- [ ] Header helpers that need string values narrow at their call site and do not cast.
- [ ] The `as unknown as string` casts in `packages/rack/src/handler/node.test.ts` are gone.
