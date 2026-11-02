---
title: "Active Job serialize writes the current Time.zone name"
status: draft
updated: 2026-11-02
rfc: "0214-activejob-surfaced-deviations"
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

A job's `serialize()` writes `"timezone": null` in trails where Rails writes the zone name, `"UTC"` in trailmap's twin. Rails: activejob/lib/active_job/core.rb serialize uses `timezone`, set from `Time.zone&.name`. Compare test/fixtures/solid-queue/{rails,trails}-enqueued.json in trailmap (found on trailmap#106). Expected: trails serializes the current Time.zone name, and the rails/DEVIATIONS.md entry is removed after the re-vendor.
