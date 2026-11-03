---
title: "intermediate-namespaces-seated-drop-const-get-full-path-row"
status: draft
updated: 2026-11-03
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: []
deps: []
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

`constGet`'s full-path fallback (`packages/ruby-compat/src/variable.ts`, the `catch` after `rbConstGet` in `constGet`) cannot be deleted by seating only `Mail`, `Net` and `MiniMime` (done in the PR that seated them). With those seated and the fallback removed, `pnpm parity:class-paths --check` raises `NameError` for ~400 rows whose intermediate namespace has no seat and no row: `ActionDispatch::Journey` (42), `Rack` (73), `Thor` (39), `Rake` (32), `I18n` (26), `Zeitwerk` (16), `ActiveSupport::Testing` (13), `Mail::Parsers` (11), `MessagePack` (10), `ActiveModel::Type` (9), `GlobalID` (8), `DidYouMean`, `Mime`, `MiniMagick`, `ActiveRecord::Associations::Builder`, `ActiveRecord::Type`, `ActiveSupport::Cache`, `ActiveStorage::Reflection`, `SolidQueue::Processes`, and ~25 smaller ones. Ruby's `rb_path_to_class` (`vendor/ruby/v3.3.11/variable.c:432`) walks segment by segment with no full-path arm.

## Acceptance criteria

- Each intermediate namespace above is seated on its parent (`TopLevel.Rack = Rack`, `Mail.Parsers = Parsers`, ...) by its defining module, so every row resolves by the segment walk.
- `constGet`'s `generatedClass(cpath)` fallback is deleted and `pnpm parity:class-paths --check` stays green.
