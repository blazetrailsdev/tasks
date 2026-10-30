---
title: "activestorage-engine-wires-globalid-identification"
status: draft
updated: 2026-10-30
rfc: "0209-activestorage-port"
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

`Attachment#purge_later` reaches `PurgeJob.perform_later(blob)`, and `packages/activejob/src/arguments.ts:140` needs the record to include `GlobalID.Identification`. globalid's railtie does that on `:active_record` load and sets the app. `packages/activestorage/src/test-helpers/database/setup.ts` does this for the suite only, along with including `Attached.Model` (`vendor/rails/v8.0.2/activestorage/lib/active_storage/engine.rb:125-131`).

## Acceptance criteria

- An application needs no manual wiring: `Base` includes `GlobalID::Identification` through a railtie and `purge_later` serializes a `Blob`.
- The manual includes in `setup.ts` are removed.
