---
title: "Port Configuration warnings/checks, CLI#check, FailedExecution error truncation and boot guards"
status: ready
updated: 2026-11-17
rfc: "0196-solid-stack"
cluster: null
packages: ["solid-queue"]
deps:
  - solid-queue-v1-7-2-remaining-drift
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api --package solid-queue` on 2026-11-16 lists these as missing:

- `configuration.rb`: 18 members, among them `warnings`, `check`, `warn_about_incorrectly_sized_database_pool`, `warn_about_missing_config_files` and `ensure_valid_worker_execution_options` (`mode` / `standalone` are in `solid-queue-v1-7-2-remaining-drift`).
- `cli.rb#check`.
- `failed_execution.rb`: `fit_into_error_column`, `error_column_limit`, `serialized_error_size`, `truncate_message`.
- `solid_queue.rb`: `time_zone` / `time_zone=`, `deprecator`, `on_exit`.
- `lifecycle_hooks.rb#on_exit`, `version.rb#next_major_version`.

Tests: `unit/configuration_test.rb` has 20 missing, and `unit/boot_guards_test.rb` (4) and `unit/cli_test.rb` (9) have no TS file.

## Acceptance criteria

- The listed members are ported at Rails names and shapes, from `vendor/solid_queue/v1.7.2`. Where `remaining-drift` already ported a member, it is not ported again.
- `configuration_test.rb`, `boot_guards_test.rb` and `cli_test.rb` are fully ported (`cli_test` through trails' Thor port) and pass on the three canonical adapters.
