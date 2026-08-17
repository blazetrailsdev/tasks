---
title: "converge-accessor-surfaced-call-set-rows-wave-2"
status: done
updated: 2026-08-17
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6667
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# Converge the remaining accessor-surfaced call-set rows (wave 2)

## Context

`converge-accessor-surfaced-call-set-rows` sized the RFC 0108 accessor cohort at
the whole cohort, not one PR. Wave 1 took the ActiveRecord slice: it converged
`ConnectionHandler#activeConnectionsQ` onto `each_connection_pool` (deleting the
duplicate `get activeConnections`), converged `PoolManager#shardNames` onto
`flat_map`, and replaced every remaining ActiveRecord row's cluster reason with
a per-row reviewed justification citing `gem/path.rb:LINE`. Two spin-off
defects were filed: `encryption-key-id-uses-sha256-not-sha1` and
`port-connection-handling-default-env-proc`.

What is left, all still carrying the RFC 0108 accessor reason or the Rack
header-accessor cluster reason:

- **The Rack header cluster** (`get_header` / `set_header` / `fetch_header` /
  `has_header?`) — ~29 rows concentrated in
  `scripts/api-compare/call-mismatches-exclude/actiondispatch/http/request.json`
  (31 rows) and `rack/request.json`. As the parent story says, this is one
  decision, not N: either trails' request/response objects grow the Rack
  accessor pair (`vendor/rails/rack/lib/rack/request.rb`,
  `actionpack/lib/action_dispatch/http/request.rb`), or it is ratified once with
  the justification recorded in a single place. Make that call first.
- **The harder ActiveRecord rows wave 1 deliberately left alone**, each a real
  dropped call rather than an idiom with no JS spelling:
  `associations/association.ts` `extensions | scope_for, unscoped`;
  `associations/collection-association.ts` `reader | reload, create`,
  `size | count_records, empty?, find_target?, select`,
  `target= | klass, replace_on_target`;
  `associations/join-dependency.ts` `reflections | drop`;
  `associations/preloader/association.ts` `preloaded_records | load_records`;
  `relation.ts` `to_sql | with_connection`, `create_or_find_by | with_connection`;
  `connection-adapters/abstract-adapter.ts` `type_map | compute_if_absent`
  (reason-texted in wave 1, but a `Concurrent::Map` memoize is worth a second
  look).
- **The remaining packages**: `activemodel/errors.json`,
  `activesupport/cache/entry.json`,
  `activesupport/number-helper/number-converter.json`,
  `activesupport/xml-mini/nokogirisax.json`, `globalid`, `i18n`,
  `trailties/{application,engine}.json`, and the non-header
  `actiondispatch` rows (`journey/route.json`, `journey/path/pattern.json`,
  `routing/inspector.json`, `middleware/{cookies,exception-wrapper,flash}.json`,
  `testing/{integration,test-response}.json`, `http/mime-negotiation.json`,
  `http/response.json`).

Enumerate the live set with:

```bash
grep -rl "0108\|get_header" scripts/api-compare/call-mismatches-exclude/
```

## Converged shape

Per the parent story: read the Rails body, make the TS accessor call what Rails
calls, delete the row by hand via `serializeBaseline` (the baseline is
only-shrink), then `pnpm parity:api:calls:tighten <package>/<shard>`. Never
`--write`. Where a Ruby idiom has no JS call form at all (`first`/`last`/`size`
positional reads — RFC 0092 `positional-idiom-analogues`, `Hash#fetch` on a
plain TS object, `Proc#call` on an unported constant), the sanctioned outcome is
a per-row reviewed reason citing `gem/path.rb:LINE`, as wave 1 did.

Size this in further waves against the LOC ceiling; the Rack header decision is
the natural first one.

## Acceptance criteria

- [ ] The Rack header-accessor cluster has one recorded decision, applied to
      every row carrying that reason.
- [ ] No row anywhere in `call-mismatches-exclude/` still carries the RFC 0108
      cluster reason ("not line-diffed individually") — each is converged and
      deleted, or replaced with a per-row justification citing `gem/path.rb:LINE`.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green, exclude-tree
      row count strictly lower.
- [ ] No `--write` reseed; marks lowered only via `parity:api:calls:tighten`.
