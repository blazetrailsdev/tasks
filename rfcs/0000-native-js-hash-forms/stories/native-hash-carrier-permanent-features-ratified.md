---
title: "Ratify which Hash carrier features are permanent, and that the carrier is not hash-convergence debt"
status: draft
updated: 2026-10-10
rfc: "0000-native-js-hash-forms"
cluster: carrier-audit
packages: [ruby-compat]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Hash` (`packages/ruby-compat/src/hash.ts:985`, `extends Map<K, V>`) already
carries `@noRailsEquivalent PERMANENT`. What is not written down is WHY each of
its private fields is permanent, so "prefer a JS object over a Hash" has no
stated boundary and a reader could take the carrier itself for debt. Measured
at trails `ddd629745a`: 58 non-test `new Hash` sites outside `hash.ts`; 38 are
a bare `new Hash()`, most of which key on objects
(`associations/join-dependency.ts:103,161,267,276`,
`associations/preloader/association.ts:101,133,354`,
`associations/preloader/through-association.ts:37`,
`relation/where-clause.ts:197`,
`actionview/src/renderer/partial-renderer/collection-caching.ts:114,144`,
`connection-adapters/abstract/transaction.ts:451,550`,
`connection-adapters/deduplicable.ts:27`); 9 sites call `compareByIdentity`;
the rest pass a default or a default proc.

The fields (`hash.ts:986-993`): `#default`, `#defaultProc`, `#frozen`,
`#eqlKeys`, `#stHash`, `#identhash`, `#binaryKeys`, `#iterLev`.

## Acceptance criteria

- [ ] `packages/ruby-compat/README.md` gains a short section, **When a Ruby
      Hash is a `Hash` and when it is an object**, stating the rule: a Ruby
      Hash is a plain JS object unless the site needs one of the features
      below, each with its MRI citation and one trails call site:
  - the `default` / `default_proc` seat (`Hash.new(obj)`, `Hash.new { }`);
  - key equality by `eql?` / `hash` for keys that are not strings
    (`#eqlKeys`, `#stHash`), which includes Array keys;
  - `compare_by_identity` (`#identhash`);
  - `FL_FREEZE` on the hash (`#frozen`), where a `FrozenError` is observable;
  - the iteration level (`#iterLev`), where a write during `each` raises;
  - `#binaryKeys`: read the field's use and either list it with its reason or
    file it.
- [ ] trails `CLAUDE.md` gets one pointer line under the bullet
      `native-hash-policy-docs-and-table-notes` adds; the detail lives in the
      README.
- [ ] The class's JSDoc (`hash.ts:974-984`) cites the new README section.
- [ ] No code changes beyond the JSDoc.

## Definition of done

This is a ratification of what the class is for, not a new exemption. It does
not license a new `new Hash()` where Rails has a string-keyed `{}`.

## Notes

Docs-only, LOC-exempt apart from the JSDoc line. Independent of the gate
stories.
