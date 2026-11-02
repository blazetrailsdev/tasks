---
title: "Port GCSService IAM signing"
status: draft
updated: 2026-11-02
rfc: "0000-activestorage-cloud-services"
cluster: as-cloud-gcs
packages: [activestorage]
deps: [activestorage-gcs-service-urls]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`vendor/rails/v8.0.2/activestorage/lib/active_storage/service/gcs_service.rb`: `issuer` :199, `email_from_metadata_server` :203,
`signer` :211, used at :116-119 and :157-160. Ruby passes `issuer:` and `signer:`
per call. `@google-cloud/storage` has neither option: `getSignedUrl` signs through
the `Storage` auth client. Nothing here can run on fake-gcs.

## Acceptance criteria

- [ ] A short spike names the Node seam (an `authClient` overriding
      `getCredentials` and `sign` is the candidate); record it in the RFC
- [ ] `gsa_email` wins over the metadata server, and the memo matches :200
- [ ] The two metadata errors raise on Rails' conditions, tested with a fake
      metadata response
- [ ] `signer` reaches IAM's `signBlob` for `projects/-/serviceAccounts/<issuer>`
- [ ] No new peer dependency: `google-auth-library` is imported only if it is
      declared; otherwise it is reached through `Storage`
