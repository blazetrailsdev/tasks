---
title: "Rails twin tests the preview row and banner"
status: in-progress
updated: 2026-11-27
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trailmap#206
claim: "2026-11-27T03:14:41Z"
assignee: "ci-runs-hub-migrations-through-db-migrate"
blocked-by: null
closed-reason: null
---

Surfaced on trailmap#160. The trails side tests the preview row on /deploys (`test/controllers/deploys-controller.test.ts`) and the preview banner (`test/.../repo-tabs.test.ts`). The Rails twin has neither.

Expected: add preview-row assertions to `rails/test/controllers/deploys_controller_test.rb`, plus a layout banner assertion when `preview_pr` is set.
