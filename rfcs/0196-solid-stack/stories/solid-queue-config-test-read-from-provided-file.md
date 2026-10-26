---
title: "Port configuration_test 'read configuration from provided file' with a TSE fixture"
status: claimed
updated: 2026-10-26
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-10-26T15:57:28Z"
assignee: "port-solid-queue-cli-and-pidfile"
blocked-by: null
closed-reason: null
---

## Context

`configuration_test.rb`'s "read configuration from provided file"
(`vendor/solid_queue/v1.1.3/test/unit/configuration_test.rb:36-41`) reads
`test/dummy/config/alternative_configuration.yml`. That file builds its
`workers` list with a Ruby ERB loop (`<% 3.times do |i| %>`).
`ActiveSupport::ConfigurationFile` renders `<%` through TSE, where the template
body is JS, so the fixture cannot be copied as is. The test was left unported
in trails#9330. `packages/solid-queue/src/configuration.test.ts` holds the
other configuration tests, and `packages/solid-queue/src/test-helpers/dummy/config/`
holds the copied fixtures.

## Acceptance criteria

- `alternative_configuration.yml` is added to the solid-queue dummy config with the loop written in TSE, giving three workers `queue_1..3` with threads 1..3.
- "read configuration from provided file" is ported under that name and passes, with `onlyWork: true` as in Rails.
