---
title: "Restore the Rails name Request to the CSP mixin (drop the comparator-workaround rename)"
status: ready
updated: 2026-09-01
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::ContentSecurityPolicy::Request` (actionpack/lib/action_dispatch/
http/content_security_policy.rb:12-22) is a module named `Request`. trails ports
it as `ContentSecurityPolicyRequest` in
`packages/actionpack/src/action-dispatch/http/content-security-policy.ts` — a
name Rails does not have, chosen not for fidelity but to work around a
comparator bug.

PR #5405 made the rename because naming it `Request` added a fifth `Request`
candidate to api-compare's `entitiesByName`. `ActionDispatch::TestRequest` lives
at `testing/test-request.ts`, which shares zero leading path segments with
`http/*`, so `resolveEntityByDeclaringFile` scored every candidate 0 and fell
through to `candidates[0]` — enumeration order. `testing/test_request.rb`
dropped from 13 matched methods to 9 (`path=`, `if_modified_since=`,
`if_none_match=`, `accept=`), silently.

That fallback is gone as of PR #7238 (RFC 0126,
`api-compare-resolve-parent-tie-picks-first-candidate`): an unseparated tie now
resolves to nothing and is reported. The fidelity cost paid to the tooling
limitation is therefore no longer owed, and PR #7238's story explicitly names
this rename as the follow-up.

Note the resolver ALSO has an exact-declaring-file arm that runs before
proximity: `testing/test-request.ts`'s `extends` records `superclassFile`
because `Request` resolves inside the package's own `src`, so the exact match
should win outright and the tie should never be reached. Verify that rather
than assume it.

## Acceptance criteria

- `ContentSecurityPolicyRequest` is renamed to `Request` in
  `packages/actionpack/src/action-dispatch/http/content-security-policy.ts` and
  at every call site, matching content_security_policy.rb:12.
- `pnpm parity:api --package actiondispatch` holds `testing/test_request.rb` at
  13 matched methods, and no other file regresses.
- `pnpm parity:api` reports no new ambiguous-parent warning naming `Request`
  (the RFC 0126 reporter added in PR #7238); if one appears, the exact
  declaring-file arm is not covering the case and that is the real bug.
