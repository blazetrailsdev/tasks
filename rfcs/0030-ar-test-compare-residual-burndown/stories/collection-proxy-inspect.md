---
title: "CollectionProxy#inspect loads target without premature reload"
status: claimed
updated: 2026-06-16
rfc: "0030-ar-test-compare-residual-burndown"
cluster: associations
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: "2026-06-16T02:12:51Z"
assignee: "collection-proxy-inspect"
blocked-by: null
---

## Context

Surfaced during RFC 0030 story a6-inverse-and-association-tail. The
`inspect does not reload a not yet loaded target` test in
`packages/activerecord/src/associations.test.ts` stays `it.skip`: there is no
`CollectionProxy#inspect` that loads the target (up to a limit) and renders the
records, honoring `attributes_for_inspect`. Rails:
`andreas.audit_logs.inspect` matches `/message: "new developer added"/` and
flips `loaded?` to true.

Rails ref: `vendor/rails/activerecord/test/cases/associations_test.rb`
(`test_inspect_does_not_reload_a_not_yet_loaded_target`); model
`vendor/rails/activerecord/test/models/developer.rb` (`log=` builds an audit_log;
`AuditLog.attributes_for_inspect = [:id, :message]`).

## Acceptance criteria

- [ ] Implement `CollectionProxy#inspect` mirroring Rails (loads target, renders records).
- [ ] Un-skip `inspect does not reload a not yet loaded target`; it passes.
