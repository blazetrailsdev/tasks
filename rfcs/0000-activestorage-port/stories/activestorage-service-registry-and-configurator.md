---
title: "Port Service, Service::Registry and Service::Configurator over an explicit service registry"
status: draft
updated: 2026-10-28
rfc: "0000-activestorage-port"
cluster: as-services
packages: ["activestorage"]
deps: ["activestorage-module-config-errors-and-log-subscriber"]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activestorage/lib/active_storage/service.rb` (180) is the abstract service:
`configure` (`:52`), `build` (`:62`), the `NotImplementedError` arms for
`upload` … `exist?` (`:71-113`), `url` (`:119-136`), `public?`, and the
private `instrument` / `service_name` / `content_disposition_with` (`:164-178`).
`service/registry.rb` (32) memoises built services; `service/configurator.rb`
(36) resolves a class by `require` + `const_get` (`:29-34`), which the RFC
replaces with an explicit registry (Design, "Disk only"). Tests:
`test/service/configurator_test.rb` (4).

## Acceptance criteria

- `Service`, `Registry` and `Configurator` are ported at their Rails names;
  `resolve` reads a registry holding the Disk service class (and Mirror, per
  open question 3), and an unknown name raises "Missing service adapter for …".
- I/O methods are async (RFC "The async boundary"); `url` and `public?` are
  sync.
- `configurator_test.rb` passes; a cloud-service case in it is a
  `PERMANENT-SKIP` citing the RFC's non-goals.
