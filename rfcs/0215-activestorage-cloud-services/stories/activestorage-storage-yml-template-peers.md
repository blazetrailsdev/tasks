---
title: "Generated storage.yml names S3 and GCS and their npm packages"
status: in-progress
updated: 2026-11-22
rfc: "0215-activestorage-cloud-services"
cluster: as-cloud-infra
packages: [trailties]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#10610
claim: "2026-11-22T22:14:04Z"
assignee: "activestorage-storage-yml-template-peers"
blocked-by: null
---

## Context

Rails' template comments out `amazon`, `google` and `microsoft`, with a `Gemfile`
hint and a mirror example
(`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/templates/config/storage.yml.tt:10-34`).
Check whether the trailties generator already mirrors it before changing anything.

## Acceptance criteria

- [ ] The `amazon` and `google` blocks are mirrored, naming the npm packages where
      Rails names gems
- [ ] `microsoft` is dropped, since `AzureStorage` raises a missing-adapter error,
      and the mirror example reads `[ amazon, google ]`, each a receipted deviation
