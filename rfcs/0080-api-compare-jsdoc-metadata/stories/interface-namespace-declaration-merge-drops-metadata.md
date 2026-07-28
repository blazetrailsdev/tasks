---
title: "Namespace declaration merge silently discards a merged interface's tag and kind"
status: draft
updated: 2026-07-28
rfc: "0080-api-compare-jsdoc-metadata"
cluster: null
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

Found while shipping PR 5467 (`extra-surface-skip-duck-typed-interface-members`).

`extractFromFiles` in `scripts/api-compare/extract-ts-api.ts` merges
declaration-merged INTERFACES carefully — the interface arm looks up
`info.modules[modKey]`, unions members, and keeps the tag with
`existing.noRailsEquivalent ??= extracted.noRailsEquivalent` — but the
namespace arm immediately below it overwrites unconditionally:

```ts
} else if (ts.isModuleDeclaration(node) && node.name) {
  info.modules[modKey] = extractNamespace(node, checker, relPath);
```

So for the legitimate TS idiom of an `interface Foo` merged with a
`namespace Foo` in one file, whichever declaration the walker reaches last
wins. When the namespace is last, the interface's `noRailsEquivalent` reason
and (since PR 5467) its `isInterface` flag are both discarded — silently
dropping the interface's members from the allowed set and re-flagging them as
extra surface. The reverse order keeps them.

Order-dependent metadata loss, not a wrong-rule bug: the tag is written
correctly and still vanishes.

## Acceptance criteria

- An `interface Foo` + `namespace Foo` pair in one file preserves the
  interface's `noRailsEquivalent` and `isInterface` regardless of declaration
  order.
- Decide explicitly whether a tagged interface merged with a namespace should
  spread its reason to the NAMESPACE's members (it should not — those are real
  exported functions, unlike type-only interface members) and encode that.
- Test covers both declaration orders.
