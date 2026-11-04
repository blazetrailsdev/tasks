---
title: "stripThenable hides `then` without returning a Proxy"
status: draft
updated: 2026-11-04
rfc: "0000-no-returned-proxies"
cluster: factory-returned
packages: ["activesupport"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

trails:

- `packages/activesupport/src/strip-thenable.ts:11`

Rails / Ruby:

- None: the helper is `@noRailsEquivalent PERMANENT`, as Ruby objects are not thenables.

Every caller receives a Proxy over its own object, which breaks identity and private-field access on the result. Inventory the callers first; most may be able to return an object whose `then` is shadowed by a non-callable own property instead.

See the RFC README for why a returned Proxy is the defect, and trails#9572 for
the first prototype-chain conversion of an instance-level dispatch.

## Acceptance criteria

- [ ] No `new Proxy(` value is returned to a caller from the site(s) above.
- [ ] The behaviour the Proxy provided is kept by the shape named in Context,
      with existing tests passing unchanged.
- [ ] A test pins the behaviour the Proxy existed for (the default, the
      raise, the deferral, the hidden member) on the new shape.
- [ ] This site's row in the `no-returned-proxy-lint-gate` list is deleted.
