---
title: "Route reflectionAdapter off the deprecated connection getter"
status: claimed
updated: 2026-07-27
rfc: "0071-ar-test-helper-suite-wide-config-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-07-27T19:53:52Z"
assignee: "route-reflection-adapter-off-base-connection"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/model-schema.ts:41` (`reflectionAdapter`) still ends
in `?? klass.connection` — the deprecated getter, which flips the lease
permanent. It was held out of `fix-with-connection-production-violations`
(PR #5323) on purpose: its own JSDoc says the fallback is load-bearing for
`try`/`catch` callers that expect a throw-free adapter resolution, so it cannot
be swapped for `withConnection` without auditing those callers.

Rails resolves schema reflection through `with_connection`
(`vendor/rails/activerecord/lib/active_record/model_schema.rb` — `load_schema!`
and friends all take the connection as a block parameter).

Blocks `flip-permanent-connection-checkout-disallowed`, which raises on any
permanent checkout in the AR suite.

## Acceptance criteria

- `reflectionAdapter` no longer reads `klass.connection`, or the remaining read
  is justified at the call site against Rails source.
- Callers relying on the throw-free contract keep working (audit them; the
  `try`/`catch` sites are named in the JSDoc).
- Existing tests stay green.
