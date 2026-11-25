---
title: "S3 public virtual-host test GETs the virtual-host URL"
status: done
updated: 2026-11-25
rfc: "0215-activestorage-cloud-services"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: 2
pr: trails#10752
claim: "2026-11-25T16:29:12Z"
assignee: "s3-public-virtual-host-get-hits-the-virtual-host"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.5.2/activestorage/test/service/s3_public_service_test.rb` "public URL generation (virtual host enabled)" GETs the `https://<bucket>/<key>` URL that `S3Service#public_url(virtual_host: true)` builds (`packages/activestorage/lib/service/s3-service.ts` `publicUrl`). trails#10648 ports the test, but because no emulator answers the bucket hostname, the GET goes to the path-style `<endpoint>/<bucket>/<key>` (`packages/activestorage/test/service/s3-public-service.test.ts`). That proves anonymous read, not virtual-host routing.

## Approach (operator ruling, 2026-11-24)

No emulator can answer a bare bucket hostname (tasks#375), so this runs the
way Rails does. `s3_public_service_test.rb` runs only when
`SERVICE_CONFIGURATIONS[:s3_public]` is set (`:7`), against a real S3 bucket.
The lane is opt-in, gated on AWS secrets, and fork PRs skip it.

Infrastructure is provisioned (2026-11-25) in the private
`blazetrailsdev/platform` repo, stack `ci-storage`:

- Bucket `public.blazetrails.dev` (us-east-1), ACLs enabled, objects expire
  after 1 day. HTTPS goes through CloudFront at `https://public.blazetrails.dev`,
  and DNS is at Namecheap via dokku-dns. A `public-read` PUT followed by a GET
  of `https://public.blazetrails.dev/<key>` returns 200.
- CI authenticates by GitHub OIDC (no keys). Role
  `trails-ci-s3-public` trusts `repo:blazetrailsdev/trails` on
  `refs/heads/main` and `pull_request`. It can list the bucket and get, put,
  set ACLs on and delete objects in it.
- Repository variables (not secrets): `AWS_S3_PUBLIC_ROLE_ARN`,
  `AWS_S3_PUBLIC_BUCKET`, `AWS_S3_PUBLIC_REGION`.

The job needs `permissions: id-token: write` and
`aws-actions/configure-aws-credentials` with `role-to-assume:
${{ vars.AWS_S3_PUBLIC_ROLE_ARN }}`. Gate it on that variable being set, and
expect forks to get no OIDC token.

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
