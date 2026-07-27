---
title: "Converge Rack/ActiveSupport/GlobalID writers onto accessors"
status: draft
updated: 2026-07-27
rfc: "0000-writer-accessor-convergence"
cluster: extra-surface
deps:
  - module-level-config-accessor-shape
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Shape 3 of the RFC for the small remaining packages (7 writers, one or two per
file):

| helper                        | file                                  | Rails writer                   |
| ----------------------------- | ------------------------------------- | ------------------------------ |
| `setDefaultQueryParser`       | `rack` `utils.ts`                     | `default_query_parser=`        |
| `setMultipartFileLimit`       | `rack` `utils.ts`                     | `multipart_file_limit=`        |
| `setMultipartTotalPartLimit`  | `rack` `utils.ts`                     | `multipart_total_part_limit=`  |
| `setParamDepthLimit`          | `rack` `utils.ts`                     | `param_depth_limit=`           |
| `setZone`                     | `activesupport` `time-zone-config.ts` | `zone=`                        |
| `setZoneDefault`              | `activesupport` `time-zone-config.ts` | `zone_default=`                |
| `setAttrInternalNamingFormat` | `activesupport` `module-ext.ts`       | `attr_internal_naming_format=` |
| `setApp`                      | `globalid` `config.ts`                | `app=`                         |

Rack's four are `Rack::Utils` module attributes
(`vendor/rack/lib/rack/utils.rb`); `Time.zone=` / `Time.zone_default=` are
`ActiveSupport::TimeWithZone` config on the `Time` class. Confirm per file
whether the slot is class-level (accessor pair) or a module binding — if any
turns out to be an `export let` module binding, it belongs to the shape-2
config-object story instead, not here.

## Acceptance criteria

- Each becomes a `get x()` / `set x(v)` pair on its host class; the `setX`
  export is deleted or made module-private and dropped from barrels.
- Any member that turns out to be a module-level `export let` is moved to the
  shape-2 story rather than forced into an accessor here — note which in the PR.
- `pnpm api:compare` matches the writers converted; `pnpm api:extra` shows the
  matching drop in extras with no stale entries.
