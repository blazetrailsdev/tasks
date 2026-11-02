---
title: "Record Azure as permanently unported in the parity registers"
status: draft
updated: 2026-11-02
rfc: "0000-activestorage-cloud-services"
cluster: as-cloud-infra
packages: [activestorage]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Decision 1. `scripts/parity/unported-files/activestorage.ts` shares one
`CLOUD_SERVICE` reason across S3, GCS and Azure, citing 0209.
`packages/activestorage/src/service/configurator.test.ts:23` parks
`azure service is deprecated` against the same non-goal. The Azure arms are
`vendor/rails/v8.0.2/activestorage/test/controllers/direct_uploads_controller_test.rb:95-134`,
`vendor/rails/v8.0.2/activestorage/test/controllers/blobs/redirect_controller_test.rb:83`,
`vendor/rails/v8.0.2/activestorage/test/controllers/representations/redirect_controller_test.rb:152`.
`SERVICE_CONFIGURATIONS[:azure]` also guards Rails' `vendor/rails/v8.0.2/activestorage/test/dummy/config/environments/test.rb:46`.

## Acceptance criteria

- [ ] The two Azure rows (`azure_storage_service.rb` with its test, and the public
      test) carry an `AZURE_SERVICE`
      reason starting `PERMANENT:`, citing `azure_storage_service.rb:21` and this RFC
- [ ] The `azure service is deprecated` skip cites this RFC's decision, not 0209's
      non-goal
- [ ] The Azure controller test arms are recorded where parity counts them, as the
      Trilogy-only arms are, and a porter of those files has one citation to use
- [ ] S3 and GCS rows are left for the stories that port them
