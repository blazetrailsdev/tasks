---
title: "stripThenable hides `then` without returning a Proxy"
status: in-progress
updated: 2026-11-07
rfc: "0221-no-returned-proxies"
cluster: factory-returned
packages: ["activesupport"]
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: trails#9821
claim: "2026-11-07T03:17:27Z"
assignee: "strip-thenable-without-a-returned-proxy"
blocked-by: null
---

## Context

trails:

- `packages/activesupport/src/strip-thenable.ts:11`

Rails / Ruby:

- None: the helper is `@noRailsEquivalent PERMANENT`, as Ruby objects are not thenables.

Every caller receives a Proxy over its own object, which breaks identity and private-field access on the result. It has seven non-test calling files; inventory them first; most may be able to return an object whose `then` is shadowed by a non-callable own property instead.

See the RFC README for why a returned Proxy is the defect, and trails#9572 for
the first prototype-chain conversion of an instance-level dispatch.

## Acceptance criteria

- [ ] `stripThenable` no longer creates a Proxy; it is deleted, or it returns
      its argument (`stripThenable(x) === x`).
- [ ] At each of the seven calling files, the value the caller hands on is the
      original object: a test asserts `===` identity with it, and that a
      `#private` field of its class still reads through that value.
- [ ] Wherever a caller needed `then` hidden (an `await` or `Promise.resolve`
      must not adopt the object), a test awaits the value and gets the object
      itself back.
