---
title: "port-non-accessor-rows-from-level-keyed-set"
status: ready
updated: 2026-09-28
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
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

Split from `port-remaining-instance-seat-rows-from-level-keyed-set`. The trails#7936
level-keyed expected set also surfaced non-accessor rows, each a method Rails defines on a seat
trails does not port it on:

- activemodel `naming.rb` `param_key` / `singular` / `plural` / `route_key` /
  `singular_route_key` / `uncountable?`.
- globalid `global_id.rb` `find` / `app`.
- actionpack `http/mime_type.rb` `symbols` / `valid_symbols?`.
- activerecord `explain_registry.rb` and `scoping.rb` `ScopeRegistry`.
- trailties `railtie.rb` / `engine.rb`.
- The rest of the trails#7936 "Newly missing rows" list not covered by
  `port-remaining-class-hosted-accessor-instance-seats`.

## Acceptance criteria

- Each row is ported on the seat Rails defines it on (the vendored `file:line`), or split into
  its own story with that citation.
- `parity:api` matched rises by the rows converged; nothing is baselined.
