---
title: "Triage the ~88 ruby-compat exports with no importer outside ruby-compat"
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

The 2026-10-16 audit found about 88 exported functions that no non-test file
outside `packages/ruby-compat` imports. Some are used inside the package,
and some are dead.

## Acceptance criteria

- [ ] A table of each export, classified as internal-only (make it unexported), dead (delete) or test-only, in the PR body or a follow-up story per bucket.
- [ ] Deletion stories are filed under this RFC. No code changes in this story.
