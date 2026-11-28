---
title: "trailmap installs @blazetrails/* from npm instead of vendored tarballs"
status: in-progress
updated: 2026-11-28
rfc: "0100-package-size-and-publish-shape"
cluster: null
packages: []
deps: ["first-alpha-practice-publish"]
deps-rfc: []
est-loc: 80
priority: 2
pr: trailmap#213
claim: "2026-11-28T01:09:28Z"
assignee: "trailmap-installs-published-packages-from-npm"
blocked-by: null
closed-reason: null
---

## Context

trailmap is the first consumer of published trails. Today its `package.json` depends on
`file:vendor/blazetrails-*-0.1.0.tgz` tarballs packed from a local trails checkout
(`@blazetrails/actionmailer` … `@blazetrails/trailties`), so it has never exercised a
registry install: the published `files` field, exact internal pins, optional native-driver
peers, or the `@blazetrails/trails` meta-package.

## Acceptance criteria

1. trailmap's `package.json` depends on the published `@blazetrails/*` packages at the
   `alpha` version (preferably via `@blazetrails/trails` plus the non-meta packages it
   needs), and the `vendor/*.tgz` tarballs and `file:` specs are removed.
2. A clean `pnpm install` from the registry, then `pnpm build`, `pnpm test`, and
   `pnpm smoke` pass in trailmap.
3. The install contains exactly one copy each of `@blazetrails/ruby-compat` and
   `@blazetrails/activesupport` (`pnpm why`).
4. Every packaging defect found (a missing file, a wrong pin, a missing type) is filed as a
   story in this RFC rather than worked around in trailmap.
