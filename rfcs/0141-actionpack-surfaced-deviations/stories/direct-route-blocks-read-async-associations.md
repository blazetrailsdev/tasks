---
title: "direct route blocks can read belongs to associations"
status: draft
updated: 2026-11-24
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: ["actionpack"]
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

Writebook's `direct :leafable_slug do |leaf, options| route_for :slugged_leafable, leaf.book, leaf.book.slug, ... end` (`vendor/writebook/v1.2.9/config/routes.rb:41-47,67-73`) reads `leaf.book` inside a synchronous `direct` block. trails' association read is async, so `examples/electron-writebook/config/routes.ts` reads the loaded target (`loadedBook`, receipt `CONVERGEABLE direct-route-blocks-read-async-associations`) and every controller / view seats `leaf.association("book").target = book` before generating a leaf URL.

## Acceptance criteria

- A `direct` / `resolve` block can read a belongs_to association the way Rails does, or a ratified rule says how (e.g. route helpers awaited), and the example's `loadedBook` and target seating are deleted.
