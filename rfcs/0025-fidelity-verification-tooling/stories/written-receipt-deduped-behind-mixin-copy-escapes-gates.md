---
title: "A written receipt deduped behind its mixin copy escapes every extra-surface gate"
status: draft
updated: 2026-09-23
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: []
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

`collectTaggedEntries` (`scripts/api-compare/extra-surface.ts`, ~:694) dedupes by
(package, tsFile, name) with first-push-wins. A mixin property's copy of a written tag
carries `noRailsEquivalentInherited: true` and is pushed from the host class or module
first. That means the WRITTEN tag on the file function is dropped, and the entry that
survives is marked `inherited`.

Found in #8014. `model-schema.ts` `loadSchemaFromAdapter` and `connection-handling.ts`
`adapterClassSync` both surface only as `inherited: true` entries (checked with
`collectTaggedEntries(ts)` over `output/ts-api.json`). Inherited entries are excluded
from `tagged.total`, from `gateStale`, from `gateRedundant` and from the permanence
classification (`gateUnclassified`). So these written receipts are never judged by any
of the four gates. For example, `model-schema.ts:677` `warmColumnsHashSync` carries an
unclassified receipt that `gateUnclassified` does not flag.

## Acceptance criteria

- When a written tag and a `noRailsEquivalentInherited` copy share a key, the written
  entry wins the dedup (`inherited` unset).
- A regression test in `extra-surface.test.ts` (a mixin object copying a tagged file
  function) fails on baseline.
- Any receipts this newly exposes as stale, redundant or unclassified are fixed, not
  allowlisted.
