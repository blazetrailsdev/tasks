---
title: "stdlib-idiom-mapping"
status: draft
updated: 2026-07-16
rfc: "0065-prism-codegen"
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

Ruby stdlib idioms pass through untranslated: `scripts/prism-codegen/out/persistence.js`
emits `attributes.collect(...)`, `id.isA(Array)`, `raise(ArgumentError, ...)`.
These have direct JS/trails equivalents (`map`, `Array.isArray`, `throw new`).
Source examples in `vendor/rails/activerecord/lib/active_record/persistence.rb`.

## Acceptance criteria

- Add a Ruby-core → JS/trails-runtime idiom table (at minimum: `collect`→`map`,
  `each`→`forEach`, `raise`→`throw new`, `blank?`/`present?`, `Array()`,
  `is_a?`→`instanceof`).
- Wire it into the CallNode handler as a lookup applied after name translation.
- Golden test asserting `raise ArgumentError` → `throw new ArgumentError`.
