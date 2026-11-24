---
title: "Writebook EmbedProvider resolves the account inside its readers"
status: draft
updated: 2026-11-24
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: ["actionview"]
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Writebook's `EmbedProvider` (`vendor/writebook/v1.2.9/app/models/embed_provider.rb:526-531`) reads `Account.first&.embed_providers` inside `resolution`, which `HtmlScrubber#keep_node?` / `#scrub_attributes` (`app/models/html_scrubber.rb`) call synchronously mid-traversal. trails' scrubber is synchronous and the account read is async, so `examples/electron-writebook/app/models/embed-provider.ts` exposes `resolution()` as an awaited step that ApplicationController runs in a `before_action` (receipt `@noRailsEquivalent CONVERGEABLE embed-provider-sync-account-read`).

## Acceptance criteria

- The provider table is resolved where Writebook resolves it (inside the readers), with no controller `before_action` priming it, e.g. once `Loofah`/`PermitScrubber` traversal can await, or the account row is read through a sync cache the framework ratifies.
- The receipt and the extra `before_action` are deleted.
