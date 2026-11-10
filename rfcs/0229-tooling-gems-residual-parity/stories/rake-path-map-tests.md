---
title: "Port rake's pathmap test files"
status: ready
updated: 2026-11-10
rfc: "0229-tooling-gems-residual-parity"
cluster: null
packages:
  - "rake"
deps: []
deps-rfc: []
est-loc: 300
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`String#pathmap` is ported (`packages/rake/lib/ext/string.ts`) but its tests are
not: `vendor/rake/v13.2.1/test/test_rake_path_map.rb` (22), `test_rake_path_map_explode.rb` (1),
`test_rake_path_map_partial.rb` (1), `test_rake_file_list_path_map.rb` (2).

## Acceptance criteria

- [ ] The four files are ported at their convention paths with every test by name.
- [ ] A test that fails on the port is fixed in `ext/string.ts`.
