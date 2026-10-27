---
title: "Converge or record the model behaviour twin-diff finds between rails/ and app/"
status: draft
updated: 2026-10-27
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

twin-diff (trailmap#84) ranks the model bodies where the Rails twin and the trails site do different things. These are behaviour differences, not spelling. For each, decide which side is right, converge the other, and record any difference that is deliberate in `rails/DEVIATIONS.md`.

- `Story#record_event`: the TS writes `rfc_id` on the event, and Ruby does not (`app/models/story.ts:580`, `rails/app/models/story.rb:270`).
- `Story.record_spawn`: the TS writes `branch` / `pane` / `rfc` fields that Ruby never writes (`story.ts:455`, `story.rb:204`).
- `Story.find_all_or_raise` vs `findAllOrThrow`: the TS collects every missing id into the `VerbExit` message, while Ruby raises on the first (`story.ts:480`, `story.rb:214`).
- `after_save :close_rfc_if_complete` (`story.rb:36`): the TS registers an inline block that tests `status === "closed"` instead of `closed?` (`story.ts:147,155`).
- `Repository#readable_by?`: Ruby uses `visibility_public?` plus an `exists?` query, and TS uses `visibility` / `findBy` (`repository.rb:28`, `repository.ts:111`).
- `ParityGraphsController#stored_gaps_for`: the TS filters with SQL `gaps IS NOT NULL`, and Ruby filters in Ruby (`parity_graphs_controller.rb:82`, `parity-graphs-controller.ts:50`).
- `ReadModelsController#index`: Ruby calls `serialize_all` twice, and TS calls `serializeRfcs` / `serializeStories` (`read_models_controller.rb:6`, `read-models-controller.ts:30`).

Rerun with `npx tsx scripts/twin-diff/cli.ts --rails rails/app`, then read the "Body deviations" section of `tmp/twin-diff/twin-diff.md`.

## Acceptance criteria

- Each item above is either converged, with a test on the side that changed, or listed in `rails/DEVIATIONS.md` with its reason.
- twin-diff no longer ranks any of these methods for the reasons given.
