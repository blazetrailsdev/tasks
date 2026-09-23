---
title: "Report a @missingRailsArgs tag stale when its declaration's only receipt stops suppressing"
status: done
updated: 2026-09-23
rfc: "0153-naming-residue-ratchet-and-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 21
pr: trails#8005
claim: "2026-09-23T17:18:15Z"
assignee: "naming-residue-burndown-activesupport"
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/compare.ts`: `argTagsUsed` gets an entry for `(tsFile, tsClass, tsName)` only inside the branch where an `@missingRailsArgs` tag suppresses a mismatch. `staleCallTags` skips any declaration whose key has no entry (`hit === undefined` means "not compared"). So if a declaration's only `@missingRailsArgs` tag stops suppressing, because its call site now passes what Rails passes, the declaration never gets an entry. The tag is never reported stale, and the only-shrink half of RFC 0099 does nothing for it.

Found while landing `@missingRailsName` in trails#7845. `nameTagsUsed` avoids the problem by seeding its key right after `callArgsCompared++`, i.e. as soon as any call-site pair of the declaration is compared, not only when a tag suppresses.

## Acceptance criteria

- [ ] `argTagsUsed` gets its key seeded once any call-site pair of the declaration is compared, the same way `nameTagsUsed` does it.
- [ ] A unit test: a declaration with an `@missingRailsArgs` tag whose call no longer mismatches reports that tag in `staleTags`.
- [ ] Any tags the fix newly reports as stale are removed in the same PR.
