---
title: "Same-file closure resolves receiver-blind property reads as methods"
status: done
updated: 2026-08-17
rfc: "0108-call-gate-false-positives"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6657
claim: "2026-08-17T16:56:50Z"
assignee: "call-arg-comparator-attr-reader-false-positives"
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

## Re-verified 2026-08-17 (draft sweep)

Still valid. `scripts/api-compare/compare.ts:701` still reads
`const SYNTHETIC_CALL_NAMES: ReadonlySet<string> = new Set(["constructor"])` — the
The #6542 fix covers constructors only, and receiver-blind property reads still
resolve against same-file methods.

_Moved from RFC 0025 in the 2026-08-17 scoping split: RFC 0025 had grown to 262
stories. This story is a call-gate **false positive** — the tool reports a
mismatch where the port is faithful — which is the whole scope of the new RFC._
