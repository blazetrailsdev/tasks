---
title: "Port GCSService's object calls"
status: draft
updated: 2026-11-02
rfc: "0000-activestorage-cloud-services"
cluster: as-cloud-gcs
packages: [activestorage]
deps: [activestorage-cloud-peer-dependencies, activestorage-service-url-is-async]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`vendor/rails/v8.0.2/activestorage/lib/active_storage/service/gcs_service.rb`: `initialize` :16, `upload` :21, `download` :34,
`update_metadata` :48, `download_chunk` :58, `delete` :66, `delete_prefixed` :74,
`exist?` :84, `compose` :139, `file_for` :172, `stream` :177, `bucket` :191,
`client` :195. fake-gcs passed every call here on 2026-11-02.

## Acceptance criteria

- [ ] `src/service/gcs-service.ts` holds `GCSService`, with `MetadataServerError` and
      `MetadataServerNotFoundError` under it (:13-14)
- [ ] `client` and `bucket` are lazy, and `client` excludes Rails' four keys (:196)
- [ ] A 400 on upload is `IntegrityError`; 404 is `FileNotFoundError`, ignored by
      `delete` and `delete_prefixed` as at :69 and :78
- [ ] `stream` looks the file up first (`skip_lookup: false`) and keeps the 5 MB loop
- [ ] `update_metadata` and `compose` set Rails' three fields, with disposition
      only when `disposition` and `filename` are both given
- [ ] `service/gcs_service.rb`'s unported row retires
- [ ] The shared service tests pass on fake-gcs
