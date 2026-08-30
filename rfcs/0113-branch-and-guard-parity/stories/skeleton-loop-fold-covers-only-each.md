---
title: "skeleton-loop-fold-covers-only-each"
status: draft
updated: 2026-08-30
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Filed here rather than against RFC 0084: 0084 is superseded (by 0106, itself
superseded by 0123) and refuses new stories, and RFC 0113 is the RFC that reads
the skeleton artifact today. This is a defect in the extraction, not in RFC
0113's arm burndown.

`foldSkeletonTokens` (`compare.ts:303-320`) folds block-iteration onto `loop` so
Ruby `xs.each { … }` and its `for (const x of xs)` port read alike. Its name set
is derived, not listed:

```ts
const LOOP_SKELETON_NAMES = new Set(
  [...JS_ENUMERABLE_ALIASES]
    .filter(([ruby, aliases]) => NO_JS_CALL_FORM.has(ruby) && aliases.includes(JS_ITERATION_CALLEE))
    .flatMap(([ruby, aliases]) => [ruby, ...aliases]),
);
```

In practice that intersection is `{each, forEach}` and nothing else. Verified:

```
foldSkeletonTokens(["ref:each","ref:each_value","ref:each_with_index","ref:filter_map",
                    "ref:map","ref:each_pair","ref:each_key","ref:reverse_each",
                    "ref:each_with_object","ref:forEach"])
=> ["loop","ref:each_value","ref:each_with_index","ref:filter_map","ref:map",
    "ref:each_pair","ref:each_key","ref:reverse_each","ref:each_with_object","loop"]
```

So a faithful `for…of` port of `each_value`, `each_pair`, `each_key`,
`each_with_index`, `each_with_object`, `reverse_each` or `filter_map` reports an
invented `loop` against a Ruby side that shows only a `ref:` reach. RFC 0113's
own story text asserts this artefact class "should NOT appear"; it appears for
every block iterator but one.

Found by the RFC 0113 noise-floor audit
(`docs/infrastructure/arm-mismatch-noise-floor.md`, extraction bug 2; sample row
23, `activesupport/deprecation/deprecators.ts#each`).

## Acceptance criteria

- [ ] The fold covers the Ruby block iterators whose faithful port is a native
      loop, not just `each` — the derivation is widened (or replaced) with its
      reason recorded at the definition, and a name whose port DOES keep a call
      (`map` to `.map`, say) is not folded.
- [ ] A unit test pins the folded set, including a negative case.
- [ ] `pnpm parity:api:arms:report`'s row count DROPS; record before/after in
      the PR body.
- [ ] Nothing new gates.
