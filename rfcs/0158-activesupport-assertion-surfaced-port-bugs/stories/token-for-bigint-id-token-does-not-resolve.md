---
title: "token-for-bigint-id-token-does-not-resolve"
status: draft
updated: 2026-11-16
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
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

Since trails#10189, `ActiveSupport::JSON.encode` routes a bigint through
`Numeric#as_json` (`packages/activesupport/lib/json/encoding.ts` `jsonify`), so
`TokenDefinition#generateToken` (`packages/activerecord/lib/token-for.ts:65`)
signs an id past `Number.MAX_SAFE_INTEGER` as its decimal digits, a string.
`resolveToken` then compares `payloadFor(model)` (`[bigint]`) with the verified
payload (`["digits"]`) by `rbEqual`, so such a token never resolves, where Rails'
Integer round-trips (`activerecord/lib/active_record/token_for.rb:51-56`).

## Acceptance criteria

- [ ] A token generated for a record with a bigint id past
      `Number.MAX_SAFE_INTEGER` resolves back to that record through
      `findByTokenFor`.
- [ ] Covered in `packages/activerecord/test/cases/token-for.trails.test.ts`.
