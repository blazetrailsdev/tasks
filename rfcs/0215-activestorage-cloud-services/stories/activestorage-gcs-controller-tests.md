---
title: "Port the GCS arms of the controller tests"
status: ready
updated: 2026-11-02
rfc: "0215-activestorage-cloud-services"
cluster: as-cloud-gcs
packages: [activestorage]
deps:
  [
    activestorage-gcs-service-test,
    activestorage-disk-and-direct-uploads-controllers,
    activestorage-blobs-controllers-and-streaming,
    activestorage-representations-controllers,
  ]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`vendor/rails/v8.0.2/activestorage/test/controllers/direct_uploads_controller_test.rb:50-92`,
`vendor/rails/v8.0.2/activestorage/test/controllers/blobs/redirect_controller_test.rb:94`,
`vendor/rails/v8.0.2/activestorage/test/controllers/representations/redirect_controller_test.rb:167`.

## Acceptance criteria

- [ ] Each parked GCS case is ported under its Rails name, replacing the
      `PERMANENT-SKIP`
- [ ] The direct-upload JSON matches Rails' headers and URL assertions, with no PUT
      needed
