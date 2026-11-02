---
title: "call-gate-credits-file-utils-async"
status: claimed
updated: 2026-11-01
rfc: "0212-trailties-port"
cluster: null
packages: []
deps:
  - ruby-compat-fileutils-module-function-instance-forms
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-01T23:56:25Z"
assignee: "call-gate-credits-file-utils-async"
blocked-by: null
closed-reason: null
---

## Context

`FileUtils.mkdirPAsync` and `rmRfAsync` (`packages/ruby-compat/src/file-utils.ts`) are the async spellings of `mkdir_p` and `rm_rf` (`vendor/ruby/v3.3.11/lib/fileutils.rb:365,1327`). `parity:api:calls` does not credit an `*Async` call as its Ruby name, so once `TestCase` includes `FileUtils` these bodies report rows: `Configuration#default_log_file` (`packages/trailties/src/application/configuration.ts`), and `CreateMigration#on_conflict_behavior`, `#revoke!` (`packages/trailties/src/generators/actions/create-migration.ts`).

## Acceptance criteria

- The call gate credits `FileUtils.<name>Async` as the Ruby `<name>`, or the bodies call what Rails calls.
- The three `@missingRailsCall` receipts naming this story are removed.
