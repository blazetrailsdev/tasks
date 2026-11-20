---
title: "File.mtime answers a Time so FileUpdateChecker can call Time.at(0)"
status: draft
updated: 2026-11-20
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`FileUpdateChecker#updated_at` is `@updated_at || max_mtime(paths) || Time.at(0)` (`vendor/rails/v8.0.2/activesupport/lib/active_support/file_update_checker.rb:111-113`), and `max_mtime` compares `File.mtime` against `Time.now` (`:117-127`). trails' `packages/activesupport/lib/file-update-checker.ts:77-97` uses `new Date(0)` / `new Date()` because ruby-compat `File.mtime` (`packages/ruby-compat/lib/file.ts:949`) answers a JS `Date`. Baselined in `scripts/api-compare/call-mismatches-exclude/activesupport/file-update-checker.json` against the blocked story `converge-code-generator-encrypted-config-file-update-checker-calls`.

## Acceptance criteria

- [ ] ruby-compat `File.mtime` answers a `Time` (`@blazetrails/date`), as MRI `rb_file_s_mtime` does (`vendor/ruby/v3.3.11/file.c`).
- [ ] `FileUpdateChecker` calls `Time.at(0)` / `Time.now`, and its baseline row is deleted.
