---
title: "Route ported require sites through the Kernel.require seat"
status: draft
updated: 2026-11-08
rfc: "0154-ruby-compat-surfaced-deviations"
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

trails#9855 seated `Kernel.require = rbFRequireFile` in ruby-compat
(`packages/ruby-compat/lib/index.ts`), and Zeitwerk wraps that seat
(`packages/zeitwerk/src/core-ext/kernel.ts`), as
`vendor/zeitwerk/v2.7.2/lib/zeitwerk/core_ext/kernel.rb:23-43` wraps
`Kernel#require`. Only `Preview.loadPreviews`
(`packages/actionmailer/lib/preview.ts`) calls through the seat. The other
ported `require` sites still call the undecorated `rbFRequireFile` directly:

- `packages/rake/src/application.ts:665`
- `packages/rackup/lib/server.ts:386`

So a Zeitwerk-managed file they load never runs `on_load`, where Ruby's
decorated `require` would.

## Acceptance criteria

- Every ported Ruby `require` of a file path calls `Kernel.require`, not
  `rbFRequireFile`.
- `rbFRequireFile` is reached only through the seat.
