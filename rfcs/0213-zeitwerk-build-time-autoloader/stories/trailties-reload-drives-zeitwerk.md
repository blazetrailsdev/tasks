---
title: "The Rails reloader drives Zeitwerk reload"
status: ready
updated: 2026-10-30
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: zw-railties
packages: ["trailties", "activesupport"]
deps: ["zeitwerk-reload-and-unload", "trailties-autoloaders-and-config-paths"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/railties/lib/rails/application/finisher.rb:83-87`, `:161-215`. RFC 0213 § "Reload".

## Acceptance criteria

- `enable_reloading` and `ActiveSupport::Dependencies.autoloader` are set in `setup_main_autoloader`.
- `_autoloaded_tracked_classes` and `DescendantsTracker.clear` run as in Rails.
- `after_class_unload` eager loads unconditionally.
- A subprocess test changes a controller and sees the new class served.
