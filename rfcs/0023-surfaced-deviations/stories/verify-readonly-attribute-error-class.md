---
title: "verify-readonly-attribute-error-class"
status: draft
updated: 2026-07-31
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found by the prism-codegen conformance scorer triage (PR #5727). Vendored
Rails verify_readonly_attribute raises ActiveRecordError
(vendor/rails/activerecord/lib/active_record/persistence.rb:945-947); the
port's verifyReadonlyAttribute (packages/activerecord/src/persistence.ts:1938)
throws ReadonlyAttributeError. Check whether the rails-error-parity ratchet
already catalogues this; if not, converge the error class to the vendored
Rails source of truth (or catalog with justification at the call site).

## Acceptance criteria

- Error class matches vendored Rails, or the divergence is catalogued in
  the error-parity exclude with a call-site justification.
- Rails' test for the raised class ported/verified.
