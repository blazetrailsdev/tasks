---
title: "Triage the ruby-compat exports with no external importer, and the single-importer exports no inline story covers"
status: done
updated: 2026-10-24
rfc: "0194-ruby-compat-native-first"
cluster: inline
packages: []
deps: []
deps-rfc: []
est-loc: 0
priority: null
pr: trails#9289
claim: "2026-10-24T21:50:42Z"
assignee: "triage-ruby-compat-exports-with-no-external-importer"
blocked-by: null
---

## Context

The 2026-10-16 audit found about 88 exported functions that no non-test file
outside `packages/ruby-compat` imports. Some are used inside the package,
and some are dead.

## Acceptance criteria

- [ ] The audit also found 62 exports with exactly one importing file. 24 are covered by the three `inline-single-use-*` stories. The remaining ~38 are classified here too, as kept (object-model state, adapter seam, `keepIf`), inline (file a story), or type/value-only.
- [ ] A table of each export, classified as internal-only (make it unexported), dead (delete) or test-only, in the PR body or a follow-up story per bucket.
- [ ] Deletion stories are filed under this RFC. No code changes in this story.
