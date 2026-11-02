---
title: "Find the Node seam for GCS issuer and signer"
status: ready
updated: 2026-11-02
rfc: "0215-activestorage-cloud-services"
cluster: as-cloud-gcs
packages: [activestorage]
deps: [activestorage-gcs-service-urls]
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Ruby passes `issuer:` and `signer:` to `signed_url`
(`vendor/rails/v8.0.2/activestorage/lib/active_storage/service/gcs_service.rb:116-119`,
`:157-160`, `:211-226`). `@google-cloud/storage` takes neither and signs through
its auth client.

## Acceptance criteria

- [ ] A throwaway script signs a URL through a custom `authClient` overriding
      `getCredentials` and `sign`, or shows why that fails
- [ ] The RFC records the seam, and `activestorage-gcs-iam-signing`'s `est-loc` is
      updated
- [ ] If no seam exists, the owner is asked before that story starts
