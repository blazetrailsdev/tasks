---
title: "tempfile-remover-debug-output"
status: draft
updated: 2026-11-03
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Tempfile::Remover#call` (`vendor/ruby/v3.3.11/lib/tempfile.rb:313-324`) prints `removing <path>...` and `done` to `$stderr` when `$DEBUG` is set (`:315`, `:322`). ruby-compat has no `$DEBUG` global, so `Remover#call` in `packages/ruby-compat/src/tempfile.ts` drops both lines and carries a `@missingRailsCall puts` receipt naming this story.

## Acceptance criteria

- [ ] ruby-compat exposes MRI's `$DEBUG` (`ruby_debug`, set by `-d` / `--debug`).
- [ ] `Remover#call` prints both lines through `$stderr.puts` when it is set, and the receipt is removed.
