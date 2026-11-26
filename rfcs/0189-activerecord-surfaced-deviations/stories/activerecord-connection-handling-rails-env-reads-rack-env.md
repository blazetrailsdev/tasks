---
title: "activerecord: ConnectionHandling TRAILS_ENV reads NODE_ENV in Rails' RACK_ENV slot"
status: draft
updated: 2026-11-26
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::ConnectionHandling::RAILS_ENV` is
`(Rails.env if defined?(Rails.env)) || ENV["RAILS_ENV"].presence || ENV["RACK_ENV"].presence`
(`vendor/rails/v8.0.5.2/activerecord/lib/active_record/connection_handling.rb:6`).
trails' `TRAILS_ENV` (`packages/activerecord/lib/connection-handling.ts:375-378`) reads
`NODE_ENV` in the `RACK_ENV` slot. The operator ruled to converge on `RACK_ENV`, and
trails#10811 did so for trailties' `Command.environment`, `resolveEnv`, `Info` and
`Engine::Configuration`; this is the one remaining framework read.

## Acceptance criteria

- [ ] `TRAILS_ENV` reads `presence(getEnv("RACK_ENV"))` where it reads `NODE_ENV`.
- [ ] activerecord tests that set or clear `NODE_ENV` to mean the env set `RACK_ENV` instead.
