---
title: "Same-file closure resolves receiver-blind property reads as methods"
status: draft
updated: 2026-08-14
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #6542 fixed one instance of the same-file call-set closure walking into a
member the body never called: `new X()` is extracted as the call name
`constructor`, so `reachedSameFileMethods` (`scripts/api-compare/compare.ts`,
`SYNTHETIC_CALL_NAMES`) resolved it against whichever constructors the file
declares.

The same receiver-blindness remains for plain property reads. The extractor
records `details.locale` / `details.formats` as the bare call names `locale`
and `formats` (see `LookupContext#detailArgsForAny`'s extracted `calls` in
`output/ts-api.json`), with no receiver. If the file also declares a method
named `locale`, the closure resolves the name to that method and unions its
call-set — and everything it reaches within `SAME_FILE_CLOSURE_DEPTH` — into a
body that only read a property off a plain object. Editing that unrelated
method then changes this body's `missing` set, exactly the class of
perturbation #6542 closed for constructors.

## Converged shape

Extraction for a Ruby/TS pair depends only on that pair's bodies and the
members they actually call. Either the extractor keeps enough receiver
information to distinguish `this.locale()` from `obj.locale`, or the closure
declines to resolve names recorded from a non-`this` receiver.

## Acceptance criteria

- A body that reads `obj.foo` does not inherit the call-set of a same-file
  method named `foo`; a test asserts it.
- Any rows the change unmasks are baselined with a Rails `file:line` citation
  or converged, and `pnpm parity:api:calls` / `:args` stay green.
