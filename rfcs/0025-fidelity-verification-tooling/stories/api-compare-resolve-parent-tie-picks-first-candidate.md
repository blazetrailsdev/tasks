---
title: "Stop resolveParent binding candidates[0] on a zero-score tie"
status: ready
updated: 2026-07-27
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: 42
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

> Re-homed from RFC 0072 (api-compare parity burndown), which was pruned to
> ActiveRecord-scoped work. This story changes `scripts/api-compare/` tooling,
> not a package, so it belongs with the fidelity-verification tooling.

`resolveParent` in `scripts/api-compare/compare.ts:1244-1263` resolves a TS
`superclass` / `extends` reference by **short name** against
`entitiesByName`, then disambiguates same-named candidates by counting shared
leading path segments with the child's file. When every candidate scores 0
(no shared prefix at all), it silently falls back to `candidates[0]` —
whichever entity happened to be enumerated first.

That fallback is not merely imprecise, it is order-dependent, and it
mis-attributes inherited methods. PR #5405 hit it directly: naming the new CSP
mixin class `Request` (the Rails name, `ActionDispatch::ContentSecurityPolicy::Request`)
in `action-dispatch/http/content-security-policy.ts` added a fifth `Request`
candidate. `ActionDispatch::TestRequest` lives at `testing/test-request.ts`,
which shares zero leading segments with `http/*`, so its parent lookup flipped
from `http/request.ts` to the CSP class and `testing/test_request.rb` dropped
from 13 matched methods to 9 — `path=`, `if_modified_since=`, `if_none_match=`,
`accept=` all went missing, with no warning emitted.

The file-structure manifest builder already detects and reports this class of
ambiguity ("last-segment collision ... bucket DROPPED"), but the inheritance
walk in `compare.ts` has no equivalent guard.

PR #5405 worked around it by naming the class `ContentSecurityPolicyRequest`
instead of the Rails name `Request`, which is a fidelity cost paid to a tooling
limitation. Fixing the resolver is the prerequisite for taking that name back.

## Acceptance criteria

- A tie in `resolveParent` (all candidates scoring 0 shared segments) no
  longer silently binds `candidates[0]`.
- The ambiguity is surfaced the way the file-structure manifest surfaces its
  own collisions, so a future rename cannot silently move matched-method
  counts.
- Measure the blast radius before and after: report any per-file matched-count
  changes the stricter resolution produces, and land them (or baseline them
  with reasons) rather than absorbing them silently.
- Follow-up (may be a separate story once this lands): rename
  `ContentSecurityPolicyRequest` in
  `packages/actionpack/src/action-dispatch/http/content-security-policy.ts`
  back to the Rails name `Request`, and confirm `testing/test_request.rb`
  holds at 13 matched.
