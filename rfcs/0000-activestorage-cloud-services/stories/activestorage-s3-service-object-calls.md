---
title: "Port S3Service's object calls"
status: draft
updated: 2026-11-02
rfc: "0000-activestorage-cloud-services"
cluster: as-cloud-s3
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

`vendor/rails/v8.0.2/activestorage/lib/active_storage/service/s3_service.rb`: `initialize` :17, `upload` :28,
`download` :40, `download_chunk` :54, `delete` :62, `exist?` :74,
`upload_with_single_part` :133, `object_for` :148, `stream` :153.
See the RFC, § "Gem-backed port rules and SDK differences".

## Acceptance criteria

- [ ] `src/service/s3-service.ts` holds `S3Service`, seated on `Service`, importing
      the SDK at the top level
- [ ] The constructor maps Ruby's flat options, reads `multipartThreshold` with a
      100 MB default, and sets `uploadOptions.acl` for `public`
- [ ] `NoSuchKey` is `FileNotFoundError` and `BadDigest` is `IntegrityError`, at
      Rails' raise sites
- [ ] `stream` keeps Rails' 5 MB ranged loop, not the SDK's body stream
- [ ] The `io.size` arm in `upload` is present; its multipart side lands with
      `activestorage-s3-service-multipart-and-compose`
- [ ] The `pattern` half of the `service/s3_service.rb` row retires, with its baseline
      JSON row; the test half goes with `activestorage-s3-service-test`
- [ ] The shared service tests pass on SeaweedFS, `compose` and `deleting by prefix`
      excepted
