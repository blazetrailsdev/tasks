---
title: "globalid: BaseLocator#locateMany mirrors index_by/filter_map, drops allowed list and idKey"
status: done
updated: 2026-10-22
rfc: "0193-small-gem-ports-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#9230
claim: "2026-10-22T16:53:09Z"
assignee: "globalid-locate-many-index-by-converges"
blocked-by: null
closed-reason: null
---

## Context

`BaseLocator#locate_many` (`vendor/globalid/v1.3.0/lib/global_id/locator.rb:133-151`) groups ids with `Hash.new { |h, k| h[k] = [] }` keyed by `gid.model_class`. It indexes each model's records with `records.index_by { |record| record.id.is_a?(Array) ? record.id.map(&:to_s) : record.id.to_s }` and answers `gids.filter_map { |gid| records_by_model_name_and_id[gid.model_name][gid.model_id] }`.

`packages/globalid/src/locator.ts#locateMany` keeps a TS-only `allowed` list of `{ gid, klass }`, normalizes every key through the invented `idKey` helper (it `JSON.stringify`s composite ids), and reads by `klass.name` where Rails reads `gid.model_name`. The reviewer of trails#9145 noted this, and it was left out of that PR's scope.

## Acceptance criteria

- [ ] `locateMany` iterates `gids` twice, as Rails does: a `next unless modelIdIsValid` grouping pass, then a `filter_map` over `gids` keyed by `gid.modelName` / `gid.modelId`. The `allowed` list is gone.
- [ ] The record index mirrors `index_by` with Rails' `to_s` / `map(&:to_s)` key. `idKey` is removed or reduced to only the unavoidable JS-key spelling of an Array key, receipted at the call site.
- [ ] The globalid locator tests stay green.
