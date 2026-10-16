---
title: "Docs: native-first rule in CLAUDE.md and ruby-compat README rule 1"
status: draft
updated: 2026-10-16
rfc: "0194-ruby-compat-native-first"
cluster: inline
packages: []
deps:
  [
    call-gate-credits-empty-size-on-proven-string-and-hash,
    native-form-analogue-for-two-arg-hash-fetch,
    native-form-analogue-for-hash-except-rest-destructure,
  ]
deps-rfc: []
est-loc: 0
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

CLAUDE.md's "Hash calls on a plain object" table covers hash calls only. The
ruby-compat README's rule 1 ("only what trails actually calls") is satisfied
by a single caller.

## Acceptance criteria

- [ ] CLAUDE.md states the general policy: native wherever behavior is identical, and a helper only where it dispatches or semantics differ. The table gains `empty?`, two-argument `fetch` and `except` rows once their gate stories land.
- [ ] CLAUDE.md § "Method visibility is compile-time only" is NOT edited here. `collapse-visibility-variants-of-send-and-respond-to` owns it.
- [ ] The README's rule 1 says a helper needs two or more importing files, object-model state, or an adapter seam.
