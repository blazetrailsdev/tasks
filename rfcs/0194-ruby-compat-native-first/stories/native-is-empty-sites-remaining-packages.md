---
title: "Native .length / Object.keys for isEmpty in the packages outside activerecord and arel"
status: claimed
updated: 2026-10-23
rfc: "0194-ruby-compat-native-first"
cluster: substitution
packages: []
deps: [call-gate-credits-empty-size-on-proven-string-and-hash]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: "2026-10-23T00:51:00Z"
assignee: "native-except-literal-key-sites"
blocked-by: null
---

## Context

The rest of the 174 `isEmpty` calls (74 files) are in actionpack, actionview,
activemodel, activesupport and trailties.

## Acceptance criteria

- [ ] Same rule as `native-is-empty-sites-activerecord-arel`.
- [ ] The PR body lists the sites that kept the helper, with the reason for each (the dispatching receiver).
