---
title: "Correct the this-typed mixin premise in RFC 0072 stories derived from the top-files inventory spike"
status: ready
updated: 2026-07-27
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Raised by PR #5336 (merged). The `extra-surface-mixin-pseudo-module-host-leak`
story — derived from the `extra-surface-activerecord-top-files-inventory` spike
(2026-07-25) — stated the leak mechanism as "`this`-typed mixin pseudo-modules
leak the whole host interface", i.e. that the extractor keys off a function's
`this` parameter and copies the named host interface's members.

That is not what `scripts/api-compare/extract-ts-api.ts` does. There is no
`this`-parameter handling anywhere in the extractor; the pseudo-module is
synthesized for any exported function whose RETURN type has construct
signatures, and the members copied are the returned constructor's instance
type. The `inheritance.ts` helpers matched because they return `typeof Base`,
not because they are `this`-typed. Same members, same fix — but the stated
mechanism was wrong, and `grep`ing for `this:` would have found the wrong set
of files.

Sibling RFC 0072 stories written off the same spike may carry the same
hypothesis. `triage-newly-visible-mixin-parity-gaps` (ready, est 120) and
`burn-down-mixin-driven-wide-ratchet-expansion` (ready, est 200) both scope
themselves by "mixin" and are the likely candidates; a scoping premise stated
as `this`-typed will select the wrong files.

## Acceptance criteria

- Re-read the two named stories (and any other RFC 0072 story citing the
  `extra-surface-activerecord-top-files-inventory` spike) and check whether
  their file-selection premise depends on the `this`-typed framing.
- Where it does, correct the body to the real mechanism: exported function
  whose return type has construct signatures
  (`extract-ts-api.ts`, the `getConstructSignatures()` branch).
- Re-derive any file/count lists those stories quote, since a `this:`-based
  derivation would have produced a different set. The authoritative query is
  the set of `<file>:<fn>__mixin` keys in `output/ts-api.json`.
- Docs-only outcome is a valid result if no sibling story turns out to depend
  on the wrong framing — record that finding on this story and close it.
