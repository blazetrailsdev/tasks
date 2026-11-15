---
title: "stepsLimit hand-rolls to_i that trails already exports"
status: draft
updated: 2026-11-15
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

Found while working on trailmap#141. `stepsLimit` (`app/controllers/sessions-controller.ts:83`) re-implements Ruby's `String#to_i` with a regex, so it reads `limit` the way the Rails twin's `params[:limit].to_i` does. trails already exports that conversion: `toI` from `@blazetrails/activesupport` (`dist/core-ext/string/conversions.js:33`) and from `@blazetrails/ruby-compat` (`dist/numeric.js:136`).

Expected: `stepsLimit` calls the framework's `toI` and keeps only the clamp (positive, at most `SESSION_STEPS_LIMIT`). The existing edge tests in `test/controllers/session-steps.test.ts` ("reads limit like to_i") must keep passing unchanged.
