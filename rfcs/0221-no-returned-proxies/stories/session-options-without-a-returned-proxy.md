---
title: "Request::Session::Options reads its delegate without a returned Proxy"
status: ready
updated: 2026-11-05
rfc: "0221-no-returned-proxies"
cluster: constructor-returned
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

trails:

- `packages/actionpack/src/action-dispatch/request/session.ts:46`

Rails / Ruby:

- `vendor/rails/v8.0.2/actionpack/lib/action_dispatch/request/session.rb:47-74`

Rails' `Options` defines no `method_missing`: it answers `[]` / `[]=` / `to_hash` / `values_at` against `@delegate`. The Proxy forwarding every missed property to `delegate` is invented; port the members Rails defines convert any dotted-read caller to `[]`, and drop the trap.

See the RFC README for why a returned Proxy is the defect, and trails#9572 for
the first prototype-chain conversion of an instance-level dispatch.

## Acceptance criteria

- [ ] No `new Proxy(` value is returned to a caller from the site(s) above:
      the constructor returns nothing.
- [ ] The class answers the members the Ruby counterpart defines (named in
      Context) as ported members under their Rails names, and nothing else.
      No `method_missing`-style trap is added, in the prototype chain or
      elsewhere, because Ruby has none here.
- [ ] Every trails caller that read a name through the old trap is converted
      to one of those members, or to a member of the object the Ruby caller
      reaches; the PR lists the converted call sites.
- [ ] A test declares a subclass with a `#private` field, constructs it, and
      reads the field, and the ported members are tested.
- [ ] This site's row in the `no-returned-proxy-lint-gate` list is deleted.
