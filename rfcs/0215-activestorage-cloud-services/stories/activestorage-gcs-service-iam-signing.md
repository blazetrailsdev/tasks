---
title: "activestorage-gcs-service-iam-signing"
status: draft
updated: 2026-11-23
rfc: "0215-activestorage-cloud-services"
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

`vendor/rails/v8.0.5.2/activestorage/lib/active_storage/service/gcs_service.rb:104-107` (url_for_direct_upload) and `:146-149` (private_url) pass `issuer:` / `signer:` when `@config[:iam]`, with `issuer` (:200-203) reading `gsa_email` or the metadata server (`email_from_metadata_server` :205-211, raising `MetadataServerNotFoundError` / `MetadataServerError`) and `signer` (:213-227) calling IAMCredentials `signBlob`. `packages/activestorage/lib/service/gcs-service.ts` (trails#10625) signs with the Storage client's own credentials only; `iam` and `gsaEmail` are accepted and dropped by `client()`.

## Acceptance criteria

- [ ] `urlForDirectUpload` and `privateUrl` port the `if @config[:iam]` arm, with `issuer` and `emailFromMetadataServer` at their Rails names and Rails' two error classes
- [ ] Signing goes through IAMCredentials `signBlob` for `issuer`, tested with a stubbed signer
