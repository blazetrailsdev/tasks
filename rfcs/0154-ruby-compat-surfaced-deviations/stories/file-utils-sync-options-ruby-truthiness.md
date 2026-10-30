---
title: "Sync FileUtils options read Ruby truthiness"
status: draft
updated: 2026-10-30
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The sync `FileUtils` commands in `packages/ruby-compat/src/file-utils.ts` (`mkdirP`, `cp`, `mv`, `rm`, `rmR`, `touch`, `removeEntry`, `removeFile`) test `verbose`, `noop`, `force` and `preserve` with `=== true`. Ruby tests them by truthiness (`vendor/ruby/v3.3.11/lib/fileutils.rb:873-879`, `:1157-1183`, `:1216-1224`). trails#9492 converged only the async forms, with `rtest`.

## Acceptance criteria

- [ ] Every sync command reads these options with `rtest`, as its async form does.
- [ ] A test passes a truthy non-boolean `force` to a sync command.
