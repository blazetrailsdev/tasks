---
title: "aggregate mapping-miss raises TypeError not Rails NoMethodError"
status: ready
updated: 2026-07-02
rfc: "0023-surfaced-deviations"
cluster: null
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

Surfaced while porting the `composed_of` aggregate expansion for
`converge-where-composed-of-aggregate-expansion` (PR #4431).

Rails' multi-mapping aggregate branch reads each mapped attribute with
`object.try!(aggregate_attr)`
(`activerecord/lib/active_record/relation/predicate_builder.rb`). `try!`
returns nil when the _receiver_ is nil, but **raises `NoMethodError`** when a
non-nil object does not respond to the mapped attribute — surfacing a broken
`composed_of` mapping as a programmer error rather than a silent `IS NULL`
no-match.

trails' `extractAggregateAttr(object, attr, tryBang=true)`
(predicate-builder.ts:680-693) matches the _semantics_ (nil receiver → null;
non-nil-missing → raise) but throws a `TypeError`, not a `NoMethodError`.
trails has no `NoMethodError` class today, so the exception type diverges
from Rails even though the trigger condition and intent are identical.

## Acceptance criteria

- [ ] Decide with the RFC owner whether trails should grow a `NoMethodError`
      (or a shared Rails-error shim) so aggregate mapping failures raise the
      Rails-matching class, or ratify the `TypeError` as acceptable.
- [ ] If converging: `extractAggregateAttr` raises the Rails-matching error
      class on a non-nil object missing a mapped attribute; add a test that
      asserts the raise (note: non-canonical/`assert_raise`-style, so keep it
      out of the fixture-parity-gated blocks).
