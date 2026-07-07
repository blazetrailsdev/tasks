---
title: "D2 — fill has_one test fixture bodies (~24 fixture-gated tests)"
status: claimed
updated: 2026-07-07
rfc: "0005-activerecord-gaps"
cluster: associations
deps: []
deps-rfc: []
est-loc: 200
priority: 8
pr: null
claim: "2026-07-07T18:25:49Z"
assignee: "d2-has-one-fixture-bodies"
blocked-by: null
---

## Context

(Re-groomed 2026-07-07.) The original blocker — "Phase G fixture adoption" from
the frozen docs/activerecord plan — is long satisfied:
`packages/activerecord/src/associations/has-one-associations.test.ts` is fully
canonical (RFC 0019 conversion), loading `companies`/`accounts` via
`fixtures([...])` and the real Rails `Company`/`Firm`/`DependentFirm`/`Account`
models. Unblocked.

What remains is 38 `it.skip` empty-body tests mirroring
`vendor/rails/activerecord/test/cases/associations/has_one_associations_test.rb`
names (grep `it.skip` in the file). They cluster roughly into:

- touch-option family (~9: "has one with touch option on create/update/touch/
  destroy/empty update/nonpersisted built", polymorphic touch variants) —
  needs `touch:` on has_one.
- build/create `with block` + "association attributes are available to
  after initialize" (~4).
- replacement/creation-failure semantics (~5: "creation failure replaces
  existing …", "replacement failure due to …").
- polymorphic/cpk shapes (~5: "nullify on polymorphic association",
  "nullification on cpk association", "with polymorphic has one with custom
  columns name", "composite primary key malformed association (owner) class").
- misc singles (marshal-nil-target, locale restrict error, query-cache reload,
  interpolated condition, readonly save, private-method proxy respond_to,
  enum-through-association, scope leakage on build/create, etc.).

Write each body faithfully against the Rails test of the same name using the
canonical fixtures/models; if a body needs a model or column the canonical
schema lacks, check vendor schema.rb/models first (do not invent). Split into
2-3 PRs by cluster if the total exceeds the 500-LOC ceiling — register
follow-up stories rather than fanning out.

## Acceptance criteria

- [ ] The skipped has_one tests get real bodies (verbatim Rails names, no
      renames); any that are blocked on a genuinely missing feature keep the
      skip but gain an inline tracked-pending-convergence note naming the
      story that covers the feature.
- [ ] `test:compare` delta non-negative for has_one_associations_test.rb.
