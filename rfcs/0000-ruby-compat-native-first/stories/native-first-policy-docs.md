---
title: "Docs: native-first rule in CLAUDE.md and ruby-compat README rule 1"
status: draft
updated: 2026-10-16
rfc: "0000-ruby-compat-native-first"
cluster: inline
packages: []
deps: []
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
- [ ] The README's rule 1 says a helper needs two or more importing files, object-model state, or an adapter seam.
