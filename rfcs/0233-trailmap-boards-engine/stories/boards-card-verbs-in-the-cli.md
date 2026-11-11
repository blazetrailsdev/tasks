---
title: "tasks card / tasks board verbs in the CLI"
status: draft
updated: 2026-11-11
rfc: "0233-trailmap-boards-engine"
cluster: cli
packages: []
deps: [boards-card-api-routes]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Phase 2, in the tasks repo. Add `tasks card claim|release|move|archive|position|show`
and `tasks board list|state|position`, posting to the routes from
`boards-card-api-routes`. The old verbs stay exactly as they are. `tasks ready`
gains a `--cards` flag that prints card terms.

## Acceptance criteria

- [ ] Every new verb has a test against a stubbed API
- [ ] Exit codes 1, 2 and 3 are preserved
- [ ] `tasks --help` lists both vocabularies
