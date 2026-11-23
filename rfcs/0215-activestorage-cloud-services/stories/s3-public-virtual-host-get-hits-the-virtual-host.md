---
title: "S3 public virtual-host test GETs the virtual-host URL"
status: ready
updated: 2026-11-23
rfc: "0215-activestorage-cloud-services"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.5.2/activestorage/test/service/s3_public_service_test.rb` "public URL generation (virtual host enabled)" GETs the `https://<bucket>/<key>` URL that `S3Service#public_url(virtual_host: true)` builds (`packages/activestorage/lib/service/s3-service.ts` `publicUrl`). trails#10648 ports the test, but because no emulator answers the bucket hostname, the GET goes to the path-style `<endpoint>/<bucket>/<key>` (`packages/activestorage/test/service/s3-public-service.test.ts`). That proves anonymous read, not virtual-host routing.

## Acceptance criteria

- [ ] SeaweedFS in CI (`.github/workflows/ci.yml`, "Start SeaweedFS and fake-gcs-server") is started with an S3 domain name (`-s3.domainName`) so virtual-host-style requests route, or the RFC 0215 Emulators section records why it cannot
- [ ] The test GETs the URL the service returned, as Rails does, with no path-style rewrite
