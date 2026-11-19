---
title: "Tag helper data: { sortMenu } emits data-sortMenu, not data-sort-menu"
status: draft
updated: 2026-11-19
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap#171, `app/views/rfc-pages/index.html.tse`: `selectTag("sort", ..., { data: { sortMenu: true } })` rendered `data-sortMenu="true"`, not `data-sort-menu`. trails' tag builder (`actionview/dist/helpers/tag-helper.js:455` joins the prefix to `dasherize(String(key))`, and `dasherize` at :69) only turns `_` into `-`, which is faithful to Rails' `key.to_s.dasherize`. In trails, though, the house spelling of a data key is camelCase, so the natural `data: { sortMenu: true }` silently emits an attribute that `[data-sort-menu]` selectors and `dataset.sortMenu` never match. trailmap worked around it by spelling the key `"sort-menu"`.

## Acceptance criteria

- Decide the rule and record it: either the data/aria prefix expansion kebab-cases a camelCase key (`sortMenu` → `data-sort-menu`, which is what `dataset` round-trips), with a `@railsDeviation` note, or it stays Rails-literal and the helper docs say to spell kebab keys.
- A tag-helper test covers `data: { sortMenu: true }` under whichever rule is chosen.
