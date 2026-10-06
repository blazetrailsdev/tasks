---
title: "rack: RackResponse's header type does not admit the rack.hijack callback"
status: draft
updated: 2026-10-06
rfc: "0177-actioncable-package-port"
cluster: null
packages: ["rack"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Raised reviewing trailmap#39, which vendors trails#8566. `RackResponse`
(`packages/rack/src/index.ts:8`) types response headers as `Record<string, string | string[]>`.
A partial hijack is requested by a response header whose value is a callable
(`vendor/rack/lib/rack/lint.rb:619-630`), which `Handler::Node#upgrade` honours since trails#8566
(`packages/rack/src/handler/node.ts`). The type does not admit it: the handler's own test casts the
callback `as unknown as string` (`packages/rack/src/handler/node.test.ts`), and so must every
application.

## Expected shape

The response header type admits a callable under `rack.hijack` and nothing else changes for other
keys; `sentHeaders` already drops `rack.*` keys before writing.

## Acceptance criteria

- [ ] An app can return `{ "rack.hijack": (stream) => ... }` with no cast, and the cast in `node.test.ts` is removed.
- [ ] A dts test: a callable under any other header name is still a type error.
