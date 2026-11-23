---
title: "Classify every package as published or private"
status: ready
updated: 2026-11-23
rfc: "0100-package-size-and-publish-shape"
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

Only `@blazetrails/website` is `"private": true` today; every other package,
including repo tooling and test support (`vitest-matchers`, `trails-tsc`,
`tse-compiler`, `activerecord-cli`), would publish. Rails publishes only its
framework gems; its tooling stays in the repo.

## Acceptance criteria

1. Every package under `packages/` is classified as published or private, and
   the list with a one-line reason per private package is in the PR body.
2. Private packages carry `"private": true`; no published package depends at
   runtime on a private one (a CI check enforces it).
3. Published packages carry `license`, `repository` (with `directory`),
   `homepage` and `publishConfig.access: "public"`.
