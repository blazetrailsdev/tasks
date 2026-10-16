---
title: "Native .length / Object.keys for isEmpty in the packages outside activerecord and arel"
status: draft
updated: 2026-10-16
rfc: "0194-ruby-compat-native-first"
cluster: substitution
packages: []
deps: [call-gate-credits-empty-size-on-proven-string-and-hash]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The rest of the 174 `isEmpty` calls (74 files) are in actionpack, actionview,
activemodel, activesupport and trailties.

## Acceptance criteria

- [ ] Same rule as `native-is-empty-sites-activerecord-arel`.
- [ ] The PR body lists the sites that kept the helper, with the reason for each (the dispatching receiver).
