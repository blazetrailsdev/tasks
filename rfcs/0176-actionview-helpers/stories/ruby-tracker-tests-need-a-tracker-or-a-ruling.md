---
title: "RubyTrackerTests have no trails tracker to run against"
status: draft
updated: 2026-10-18
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionview/test/template/dependency_tracker_test.rb:274-302` (`RubyTrackerTests`) holds three tests run only against `ActionView::DependencyTracker::RubyTracker`: "dependencies skip unknown options", "dependencies finds spacer templates", "dependencies skip commented out renders". trails has no RubyTracker: `render-parser-and-ruby-tracker-when-a-handler-needs-them` closed FALSIFIED because no trails handler compiles Ruby source. The three are parked as `it.skip` in `packages/actionview/src/template/dependency-tracker.test.ts` (`describe("RubyTrackerTests")`) under `BLOCKED: ruby-tracker-tests-need-a-tracker-or-a-ruling`.

## Acceptance criteria

- [ ] Either the three tests run against a trails tracker that answers what RubyTracker answers (unknown render options skipped, `spacer_template` found, a `<%#` comment ignored), or the repo owner rules them permanently unportable and they move under a `PERMANENT-SKIP:` line citing the ratified section.
