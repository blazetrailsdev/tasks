---
title: "Audit the 28 setX functions with no Rails counterpart"
status: done
updated: 2026-07-27
rfc: "0081-writer-accessor-convergence"
cluster: extra-surface
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 5392
claim: "2026-07-27T02:13:09Z"
assignee: "audit-setx-functions-without-rails-counterpart"
blocked-by: null
closed-reason: null
---

## Context

While classifying the repo's 95 exported `setX` functions, 28 turned out to have
NO Ruby counterpart under either spelling (`set_x` or `x=`) — neither faithful
ports nor writer re-spellings. This story audits the DATA-LAYER subset of them
(`activerecord` / `activemodel` / `arel`); the rest belong to packages outside
this RFC's scope and are not covered here.

activerecord members include `setCurrentAdapterResolver` (`type.ts`),
`setDjasScopeBuilder` and `setAssociationRelationFactory`
(`associations/_scope-slots.ts`), `setGlobalPreviousSchemesFn`
(`encryption/encrypted-attribute-type.ts`), `setEncryptingOnlyEncryptorFactory`
(`encryption/context.ts`), `setBaseResolver` (`log-subscriber.ts`),
`setStoreCoder` (`store.ts`), `setEnumWarn` (`enum.ts`), `setPrimaryKeyAttr`
(`attribute-methods/primary-key.ts`), `setTokenForSecret` (`token-for.ts`),
`setPermanentConnectionCheckout` and `setRaiseIntWiderThan64bit`
(`ar-config.ts`), `setDefaultTimezone` (`type/internal/timezone.ts`), plus
test-only helpers in `test-helpers/ddl-profile.ts`.

Two are not writers at all — `setDifference` and `setIntersection`
(`associations/has-many-association.ts`) are set-theory helpers that the `setX`
grep over-collects.

## Acceptance criteria

- Each data-layer member is classified: faithful port under a name the
  classifier missed (irregular Rails spelling), a writer that belongs in one of
  this RFC's convergence stories, a genuine trails-only seam, or a false
  positive.
- Findings recorded as an audit report; anything convergeable is registered as a
  story rather than fixed here.
- Genuine seams get the justification they need AT THE CALL SITE, and are NOT
  added to `extra-surface-allow.json` if a convergence story exists for them.
