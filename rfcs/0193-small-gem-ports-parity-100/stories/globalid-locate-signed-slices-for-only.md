---
title: "globalid: locateSigned/locateManySigned pass only :for to SignedGlobalID.parse"
status: claimed
updated: 2026-10-20
rfc: "0193-small-gem-ports-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: "2026-10-20T13:55:38Z"
assignee: "globalid-extract-top-level-global-id-rb"
blocked-by: null
closed-reason: null
---

## Context

`Locator.locateSigned` / `locateManySigned` (`packages/globalid/src/locator.ts`) call `SignedGlobalID.parse(String(sgid), { for: options.for, verifier: options.verifier })`. Rails passes only `options.slice(:for)`: `vendor/globalid/v1.3.0/lib/global_id/locator.rb:106-108` (`locate_many_signed`) and the matching `locate_signed` above it, so the verifier comes from `SignedGlobalID.verifier` via `pick_verifier`.

## Acceptance criteria

- [ ] Both methods pass `slice(options, "for")` (or `{ for: options.for }`) exactly as Rails; `LocateSignedOptions.verifier` is dropped or made optional.
- [ ] Tests that relied on the passed verifier set `SignedGlobalID.verifier` instead, as Rails' tests do.
