---
title: "Pin the MethodInfo emit-site inventory with a coverage test"
status: claimed
updated: 2026-07-27
rfc: "0080-api-compare-jsdoc-metadata"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: "2026-07-27T21:46:16Z"
assignee: "pin-methodinfo-emit-site-inventory"
blocked-by: null
closed-reason: null
---

# Pin the MethodInfo emit-site inventory with a coverage test

## Context

PR #5358 (RFC 0080) wired `@noRailsEquivalent` through the extractor and took
FIVE review rounds, each finding one more `MethodInfo` emit site the tag
didn't reach: class members, synthesized `__mixin` members, exported namespace
members, interface method signatures, and interface `extends`-resolved members.
Each was a real gap; there was no mechanical way to enumerate the sites, so
completeness was asserted from grep and was wrong twice.

`scripts/api-compare/extract-ts-api.ts` has ~10 places that construct a
`MethodInfo`. Whether a per-method field must be copied at a given site depends
on one thing: whether `collectTsFileNames`
(`scripts/api-compare/extra-surface.ts`) counts that entry as the file's own
surface. The rule established in #5358:

- counted → the site MUST read declaration-derived metadata
  (`internal`, `noRailsEquivalent`)
- not counted → it must NOT (a copied tag can never match and reports stale):
  `__mixin` members with `declaredIn` (skipped via `synthesizedMixin`), and
  `extractFileLocalHelpers` output (`internal: true`)

Interface `extends`-resolved members are the trap: they carry NO `declaredIn`,
so they ARE counted — reasoning by analogy with the `__mixin` case gets it
backwards. That mistake was made twice in review.

The next per-method field (`@missingRailsCall` from PR #5229 is the obvious
candidate) will repeat this discovery loop unless the inventory is pinned.

## Acceptance criteria

- A test in `extract-ts-api.test.ts` that extracts one fixture exercising
  EVERY emit path (class member, getter/setter, property, object-literal
  member incl. shorthand and alias forms, top-level function, named-export
  function, namespace function and const, interface signature, interface
  extends-resolved member, `__mixin` own and foreign member, file-local
  helper) and asserts, per entry, whether declaration-derived metadata is
  present — so adding a field with a missed site fails here.
- A comment block above the emit sites (or in the module JSDoc) stating the
  counted-vs-not rule and pointing at `collectTsFileNames` as the authority.
- No behavior change; this is a guard for the NEXT field.
