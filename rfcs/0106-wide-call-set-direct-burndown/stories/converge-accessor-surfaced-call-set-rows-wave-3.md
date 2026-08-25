---
title: "converge-accessor-surfaced-call-set-rows-wave-3"
status: done
updated: 2026-08-17
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6668
claim: "2026-08-17T20:37:59Z"
assignee: "converge-accessor-surfaced-call-set-rows-wave-3"
blocked-by: null
closed-reason: null
---

# Converge the remaining accessor-surfaced call-set rows (wave 3)

## Context

Wave 1 took the ActiveRecord slice of the RFC 0108 accessor cohort. Wave 2 took
the **Rack header-accessor cluster** and made the recorded decision the parent
story asked for: trails' `ActionDispatch::Request` already carries the Rack
accessor pair (`getHeader` / `setHeader` / `hasHeader` / `fetchHeader`,
rack/lib/rack/request.rb:95-118), so every ported body was converged onto it
rather than the cluster being ratified. 28 of the 29 cluster rows are gone; the
two residuals are filed as their own stories
(`converge-response-cookies-onto-set-cookie-header`,
`converge-request-method-onto-methodoverride-original-method`).

What is left is the ~50 rows still carrying the RFC 0108 cluster reason
("Cluster-vetted: … not line-diffed individually"). Enumerate with:

```bash
grep -rl "0108" scripts/api-compare/call-mismatches-exclude/
```

They fall into three groups:

- **The harder ActiveRecord rows wave 1 deliberately left alone**, each a real
  dropped call rather than an idiom with no JS spelling:
  `associations/association.ts` `extensions | scope_for, unscoped`;
  `associations/collection-association.ts` `reader | reload, create`,
  `size | count_records, empty?, find_target?, select`,
  `target= | klass, replace_on_target`;
  `associations/join-dependency.ts` `reflections | drop`;
  `associations/preloader/association.ts` `preloaded_records | load_records`;
  `relation.ts` `to_sql | with_connection`, `create_or_find_by | with_connection`;
  `connection-adapters/abstract-adapter.ts` `type_map | compute_if_absent`.
- **The remaining packages**: `activemodel/errors.json`,
  `activesupport/cache/entry.json`,
  `activesupport/number-helper/number-converter.json`,
  `activesupport/xml-mini/nokogirisax.json`, `globalid`, `i18n`,
  `trailties/{application,engine}.json`.
- **The non-header `actiondispatch` rows**: `journey/route.json`,
  `journey/path/pattern.json`, `routing/inspector.json`,
  `middleware/{cookies,exception-wrapper}.json`,
  `testing/{integration,test-response}.json`, `http/mime-negotiation.json`,
  `http/response.json`.

## Converged shape

Read the Rails body, make the TS accessor call what Rails calls, delete the row
by hand via `serializeBaseline` (the baseline is only-shrink), then
`pnpm parity:api:calls:tighten <package>/<shard>`. Never `--write`. Where a Ruby
idiom has no JS call form at all (`first`/`last`/`size` positional reads — RFC
0092 `positional-idiom-analogues`, `Hash#fetch` on a plain TS object,
`Proc#call` on an unported constant), the sanctioned outcome is a per-row
reviewed reason citing `gem/path.rb:LINE`, as wave 1 did.

Size against the LOC ceiling; split into a wave 4 if it does not fit.

## Acceptance criteria

- [ ] No row anywhere in `call-mismatches-exclude/` still carries the RFC 0108
      cluster reason — each is converged and deleted, or replaced with a per-row
      justification citing `gem/path.rb:LINE`.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green, exclude-tree
      row count strictly lower.
- [ ] No `--write` reseed; marks lowered only via `parity:api:calls:tighten`.
