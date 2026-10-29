---
title: "Port Service::MirrorService and MirrorJob for Disk mirrors"
status: ready
updated: 2026-10-29
rfc: "0209-activestorage-port"
cluster: as-services
packages: ["activestorage"]
deps: ["activestorage-disk-service", "activestorage-blob-and-downloader"]
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

`vendor/rails/v8.0.2/activestorage/lib/active_storage/service/mirror_service.rb` (93) uploads to a primary
and every mirror (`:45-50`), deletes across all (`:52-59`), delegates reads to
the primary (`:18`), and `mirror_later` enqueues `MirrorJob`
(`app/jobs/active_storage/mirror_job.rb`, 15). `test/service/mirror_service_test.rb`
(7 plus the shared tests) mirrors three Disk services to a Disk primary
(`:6-14`). This story exists only if the RFC's open question 3 is answered
yes; otherwise close it `FALSIFIED:`.

## Acceptance criteria

- `MirrorService` and `MirrorJob` are ported; `perform_across_services` awaits
  each service, and `mirror_later` awaits `perform_later`.
- `Mirror` joins the service registry.
- `mirror_service_test.rb` passes.
