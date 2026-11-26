---
title: "Deploy the image CI already built and smoke-tested (dokku git:from-image), not a rebuild on the box"
status: ready
updated: 2026-11-26
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Every trailmap deploy builds its image on the box: `git push dokku` runs the
Dockerfile, which took about 80s of the 2m18s deploy of 3efdb6b. trailmap#198
cut that to roughly 55–70s. CI's `image` job already builds the same Dockerfile
(`docker build -t trailmap:ci .`, `.github/workflows/ci.yml:192`) and boots it
with `scripts/smoke-image.sh`. Then it throws the image away.

## Acceptance

- On `main`, CI pushes the smoke-tested image to a registry (ghcr), tagged
  with the commit SHA. Which registry, and which token CI pushes with, is the
  first decision, and it is the owner's.
- The deploy runs `dokku git:from-image trailmap <registry>/trailmap:<sha>`,
  so the box runs no build. The `release` task (`db:prepare`) and the
  healthchecks are unchanged.
- docs/deploy.md describes the new deploy and the fallback (`git push dokku`
  still works).
- Measure the deploy before and after, and put the numbers in the PR.
