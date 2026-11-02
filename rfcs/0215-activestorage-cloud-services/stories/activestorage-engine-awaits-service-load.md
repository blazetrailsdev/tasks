---
title: "Await Configurator.load in the active_storage.services initializer"
status: ready
updated: 2026-11-02
rfc: "0215-activestorage-cloud-services"
cluster: as-cloud-infra
packages: [activestorage]
deps: [activestorage-configurator-loads-services, activestorage-engine]
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`vendor/rails/v8.0.2/activestorage/lib/active_storage/engine.rb:139-153` builds `Service::Registry` and fetches the configured
service. Once a cloud service is configured, its file must be loaded before
`Registry#fetch`, which stays sync because `Blob#service` is.

## Acceptance criteria

- [ ] The initializer awaits `Configurator.load` before building the registry
- [ ] A `service: S3` config with no SDK fails at boot with Rails' message
- [ ] The `config_choice` arm reads as in Rails
