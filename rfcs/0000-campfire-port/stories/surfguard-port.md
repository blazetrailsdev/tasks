---
title: "surfguard: port the SSRF address policy"
status: draft
updated: 2026-11-27
rfc: "0000-campfire-port"
cluster: campfire-deps
packages: [surfguard]
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design. `basecamp/surfguard` (MIT), a git-sourced gem: `lib/surfguard.rb` and
`version.rb`, 404 lines. The repo's `go/` and `rust/` ports are out of scope. Campfire's
`RestrictedHTTP::PrivateNetworkGuard` (`lib/restricted_http/private_network_guard.rb:14-21`)
calls `Surfguard.resolve_public_ips` and rescues `Surfguard::Unresolvable`
(`app/models/push/subscription.rb:25`). DNS resolution maps to `node:dns`.

## Acceptance criteria

- [ ] surfguard vendored at a pinned commit, `packages/surfguard` created
- [ ] the gem's `test/` ported and passing, except tests that need the network, parked with a reason
- [ ] the new package registered as a new package needs (`ci.yml` lanes, the workspace guard fixture, `vendor/sources.ts`)
