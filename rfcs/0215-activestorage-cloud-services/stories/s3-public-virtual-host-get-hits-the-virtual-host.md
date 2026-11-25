---
title: "S3 public virtual-host test GETs the virtual-host URL"
status: blocked
updated: 2026-11-25
rfc: "0215-activestorage-cloud-services"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: 2
pr: trails#10663
claim: "2026-11-23T19:42:16Z"
assignee: "s3-public-virtual-host-get-hits-the-virtual-host"
blocked-by: "Operator: provision a domain-named public S3 bucket behind HTTPS (CloudFront + ACM) and add its credentials as repo secrets; see the story's Approach section."
closed-reason: null
---

## Context

`vendor/rails/v8.0.5.2/activestorage/test/service/s3_public_service_test.rb` "public URL generation (virtual host enabled)" GETs the `https://<bucket>/<key>` URL that `S3Service#public_url(virtual_host: true)` builds (`packages/activestorage/lib/service/s3-service.ts` `publicUrl`). trails#10648 ports the test, but because no emulator answers the bucket hostname, the GET goes to the path-style `<endpoint>/<bucket>/<key>` (`packages/activestorage/test/service/s3-public-service.test.ts`). That proves anonymous read, not virtual-host routing.

## Approach (operator ruling, 2026-11-24)

No emulator can answer a bare bucket hostname (tasks#375), so this runs the
way Rails does. `s3_public_service_test.rb` runs only when
`SERVICE_CONFIGURATIONS[:s3_public]` is set (`:7`), against a real S3 bucket.
The lane is opt-in, gated on AWS secrets, and fork PRs skip it.

Operator prerequisites, which block the story until done:

- An S3 bucket whose name is a domain the operator controls, e.g.
  `trails-ci-public.<domain>`, with a public-read policy for objects.
- DNS for that name, served over HTTPS, since `public_url` builds `https://`.
  S3 website endpoints are HTTP only, so this needs CloudFront (or another TLS
  front) with the bucket as origin and an ACM certificate for the name.
- An IAM user, or an OIDC role, scoped to that bucket, stored as repo secrets.

## Acceptance criteria

- [ ] A CI job (in `.github/workflows/ci.yml`, or a separate workflow) runs
      `s3-public-service.test.ts` against the real bucket when the secrets are
      present, and is skipped otherwise. It is not a required check, since
      forks cannot run it.
- [ ] The test reads its `s3_public` configuration from the environment, like
      Rails' `SERVICE_CONFIGURATIONS`, and is skipped when it is absent.
- [ ] "public URL generation (virtual host enabled)" GETs the URL the service
      returned, as Rails does, with no path-style rewrite, and asserts 200.
- [ ] The SeaweedFS lane keeps the remaining S3 public tests. The virtual-host
      test does not run there.
- [ ] RFC 0215's Emulators section records the split.
