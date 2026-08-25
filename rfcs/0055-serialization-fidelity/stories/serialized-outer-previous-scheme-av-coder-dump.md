---
title: "Serialized(Encrypted) previous-scheme AV coder-dumps into garbage IN candidate — verify Rails parity, pin behavior"
status: done
updated: 2026-07-23
rfc: "0055-serialization-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5155
claim: "2026-07-23T16:09:54Z"
assignee: "serialized-outer-previous-scheme-av-coder-dump"
blocked-by: null
closed-reason: null
---

## Context

After #5142 retired the AV-wrapping invention, a previous-scheme
`AdditionalValue` for a Serialized(Encrypted(...)) attribute (encrypts →
serialize, outer `Type::Serialized`) now reaches `Serialized.serialize`
(`packages/activerecord/src/type/serialized.ts`) instead of the deleted
brand unwrap: `coder.dump(AV)` produces a JSON dump of the AV object —
including its `type` (an `EncryptedAttributeType` carrying the previous
Scheme) — which then encrypts into a garbage IN-list candidate. Rails has
the identical exposure (`Type::Serialized#serialize` coder-dumps the AV;
`ExtendedEncryptableType` only prepends the bare `EncryptedAttributeType`,
extended_deterministic_queries.rb:151-158), so #5142 is faithful — but the
consequences are: (1) previous-scheme plaintext lookups on Serialized-outer
deterministic attributes silently miss (the candidate never matches), and
(2) the dumped AV JSON may embed scheme internals in a SQL bind (log/trace
exposure). The guard test
`extended-deterministic-queries.trails.test.ts` only asserts the
current-scheme candidate.

## Acceptance criteria

- Decide the Rails-faithful disposition: reproduce in vendored Rails
  (encrypts-then-serialize + previous_schemes + deterministic where) to
  confirm the miss/garbage candidate is Rails behavior; document the
  finding.
- If Rails genuinely produces the same garbage candidate, add a trails
  guard test pinning the divergence-free behavior (previous-scheme lookup
  on Serialized-outer attrs misses, no throw) and confirm no scheme/key
  material lands in binds; otherwise converge to whatever Rails does.
