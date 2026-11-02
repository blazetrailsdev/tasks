---
title: "Port s3_public_service_test.rb"
status: draft
updated: 2026-11-02
rfc: "0000-activestorage-cloud-services"
cluster: as-cloud-s3
packages: [activestorage]
deps: [activestorage-s3-service-test]
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`vendor/rails/v8.0.2/activestorage/test/service/s3_public_service_test.rb`: `public acl options`, `public URL
generation`, `public URL generation (virtual host enabled)`, `direct upload`.
SeaweedFS answered 200 to an anonymous GET after `public-read`.

## Acceptance criteria

- [ ] All four pass, each with its anonymous GET
- [ ] The `amazonaws.com` match and the GET use separate services, and the split is
      commented at the test
- [ ] `virtual_host` is exercised through an endpoint the emulator can answer, or
      its GET is recorded as a gap in the RFC
