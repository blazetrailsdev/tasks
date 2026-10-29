---
title: "Port ActiveStorage::Filename, Record, Current and BaseJob"
status: in-progress
updated: 2026-10-29
rfc: "0209-activestorage-port"
cluster: as-models
packages: ["activestorage"]
deps: ["activestorage-module-config-errors-and-log-subscriber"]
deps-rfc: []
est-loc: 200
priority: null
pr: trails#9461
claim: "2026-10-29T22:08:18Z"
assignee: "activestorage-filename-record-and-current"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activestorage/app/models/active_storage/filename.rb` (75): `wrap`, `base`,
`extension_with_delimiter` / `_without_delimiter`, `sanitized` (`:59-62`),
`to_s`, `as_json`, `<=>` (`:72`). `record.rb` (7) is the abstract
`ActiveRecord::Base` subclass; `current.rb` (5) is a `CurrentAttributes` with
`url_options`; `app/jobs/active_storage/base_job.rb` (4). Test:
`test/models/filename_test.rb` (9).

## Acceptance criteria

- The four classes are ported; `Current` sits on activesupport's
  `CurrentAttributes`, `Record` is abstract.
- `Filename#<=>` is ported as ruby-compat's comparable protocol, not an
  invented `compare`.
- `filename_test.rb` passes.
