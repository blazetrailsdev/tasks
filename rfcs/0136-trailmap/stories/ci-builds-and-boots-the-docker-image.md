---
title: "trailmap: CI never builds the image, so a broken Dockerfile is found by the deploy"
status: draft
updated: 2026-10-05
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

After trailmap#35 the smoke boot runs in production mode with assets laid out by
`scripts/build-assets.sh`, the same script the Dockerfile runs. What CI still does not do is build
the image: a broken `Dockerfile` step, a file missing from the build context (`.dockerignore`), or a
difference between the build stage and the runtime stage is found by the deploy, after merge.
Both failed deploys of 2026-10-03 were found that way. The image was built by hand for #32 and #35
to check them.

## Acceptance criteria

- [ ] A CI job builds the image from the PR's commit and fails the PR if the build fails.
- [ ] The job runs the built image with a database and a secret and gets `/up` green and the stylesheet with a 200, so the runtime stage is what is tested, not the checkout.
