---
title: "activestorage-solid-queue-api-remainder"
status: in-progress
updated: 2026-11-25
rfc: "0259-near-complete-packages-to-100"
cluster: null
packages: []
deps:
  - api-near-complete-packages-reach-100
deps-rfc: []
est-loc: null
priority: null
pr: trails#10760
claim: "2026-11-25T17:55:01Z"
assignee: "activestorage-solid-queue-api-remainder"
blocked-by: null
closed-reason: null
---

## Context

Split from `api-near-complete-packages-reach-100` (LOC ceiling). trailties now reports
100% (`SCOPED_SKIP_GROUPS` for `jruby?`, `version_manager_ruby_version`, Ripper's
`comments` / `on_comment` and `run_suite`). Still missing:

- activestorage (`vendor/rails/v8.0.5.2/activestorage/lib/active_storage.rb`):
  `checksum_implementation` / `=`, `streaming_max_ranges` / `=`,
  `ffmpeg_format_whitelist_arguments`; `image_magick.rb` `require_securable_mini_magick!`.
- solid-queue (`vendor/solid_queue/v1.7.2/lib/solid_queue/`):
  `configuration.rb:136-144` `ensure_fiber_workers_have_required_dependency` and
  `attributes=` (declaration-only); `processes/interruptible.rb:31-38` `self_pipe` /
  `create_self_pipe` (the port wakes through a promise); `active_job/batch_id.rb`
  `initialize`; the `add_batches_to_solid_queue.rb` migration template's `change`.

## Acceptance criteria

- [ ] Each member is ported at its Rails name, or has a reasoned `SCOPED_SKIP_GROUPS` /
      `unported-files` entry.
- [ ] `methodsMissing` is 0 for activestorage and solid-queue.
