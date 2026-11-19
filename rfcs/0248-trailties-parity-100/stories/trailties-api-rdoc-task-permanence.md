---
title: "trailties: api/generator.rb and api/task.rb are not ported"
status: in-progress
updated: 2026-11-19
rfc: "0248-trailties-parity-100"
cluster: receipts
packages: [trailties]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#10373
claim: "2026-11-19T18:33:07Z"
assignee: "port-source-paths-for-not-namespaced-generators-test"
blocked-by: null
closed-reason: null
---

## Context

`api/generator.rb` (4 members) and `api/task.rb` (11) build Rails' own API docs
with SDoc/RDoc. They are ✗ in `parity:api`. Rails ships them inside railties but
they document the Rails repo, not an app.

Operator ruling (2026-11-19): they are not ported. trails' API docs are built
by its own TypeDoc pipeline (`packages/website`), which is not a mirror of
`Rails::API::Task` / `RDoc::Generator::API`.

## Acceptance criteria

- [ ] Root CLAUDE.md gains a section "Rails API-doc tooling is not ported
      (`Rails::API::Task`, `RDoc::Generator::API`)" recording the ruling.
- [ ] Both files' rows are receipted `PERMANENT` citing that section (unported-files
      rows permanent, as Trilogy's are).
- [ ] `parity:api` shows neither file as Miss.
