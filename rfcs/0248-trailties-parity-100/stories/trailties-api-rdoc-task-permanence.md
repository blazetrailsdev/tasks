---
title: "trailties: rule on api/generator.rb and api/task.rb"
status: ready
updated: 2026-11-18
rfc: "0248-trailties-parity-100"
cluster: receipts
packages: [trailties]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`api/generator.rb` (4 members) and `api/task.rb` (11) build Rails' own API docs
with SDoc/RDoc. They are ✗ in `parity:api`. Rails ships them inside railties but
they document the Rails repo, not an app. RFC Open question 2.

## Acceptance criteria

- [ ] Either both files are ported against a TypeDoc equivalent, or each row is receipted `PERMANENT:` with a ratified section.
- [ ] `parity:api` shows neither file as Miss.
