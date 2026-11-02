---
title: "Make Service#url and url_for_direct_upload async on every service"
status: draft
updated: 2026-11-02
rfc: "0215-activestorage-cloud-services"
cluster: as-cloud-infra
packages: [activestorage]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

0209 kept these sync because Disk signs in memory. Both SDKs sign asynchronously,
and GCS IAM signing is a network call (`vendor/rails/v8.0.2/activestorage/lib/active_storage/service/gcs_service.rb:211-226`). See
the RFC, § "The async boundary". Rails' sync bodies are `vendor/rails/v8.0.2/activestorage/lib/active_storage/service.rb:134-143`,
`vendor/rails/v8.0.2/activestorage/lib/active_storage/service/disk_service.rb:77-99` and `vendor/rails/v8.0.2/activestorage/lib/active_storage/service/mirror_service.rb`.
The redirect and direct-upload controllers in 0209 are still in flight, so this
PR converts whichever have landed.

## Acceptance criteria

- [ ] `Service#url`, `#urlForDirectUpload` and the Disk and Mirror overrides are
      async, and `privateUrl` / `publicUrl` may be
- [ ] `headersForDirectUpload` stays sync
- [ ] `Blob#url`, `Blob#serviceUrlForDirectUpload`, `Variant#url` and
      `VariantWithRecord#url` are async, and every caller awaits
- [ ] A CLAUDE.md section records the ruling, and the RFC's decisions cite it
- [ ] A grep of every `.url(` and `urlForDirectUpload(` caller shows each awaited,
      and the Disk and Mirror tests pass
