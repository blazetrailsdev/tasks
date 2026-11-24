---
title: "Port jbuilder templates"
status: draft
updated: 2026-11-24
rfc: "0142-trailties-surfaced-deviations"
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

Writebook's markdown upload response is a jbuilder view (`vendor/writebook/v1.2.9/app/views/action_text/markdown/uploads/create.json.jbuilder`). trails has no jbuilder, so `examples/electron-writebook/app/controllers/action-text/markdown/uploads-controller.ts` renders the same JSON with `render json:`.

## Acceptance criteria

- jbuilder is ported (a `.jbuilder`-equivalent template handler), and the example renders `create.json.jbuilder` through it.
