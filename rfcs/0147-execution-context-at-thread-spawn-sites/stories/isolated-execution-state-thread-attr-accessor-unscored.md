---
title: "Thread.attr_accessor :active_support_execution_state is unscored by parity:api"
status: draft
updated: 2026-09-15
rfc: "0147-execution-context-at-thread-spawn-sites"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api --package activesupport --missing` reports `isolated_execution_state.rb`
at 10/12 (83%), with the two remaining members being the Thread attribute declared at
`vendor/rails/activesupport/lib/active_support/isolated_execution_state.rb:7`:

```ruby
Thread.attr_accessor :active_support_execution_state
```

reported as missing `activeSupportExecutionState` / `setActiveSupportExecutionState`.
Trails declares it via TypeScript module augmentation on `Thread`
(`packages/activesupport/src/isolated-execution-state.ts`), which `parity:api`'s
extractor does not score as members of that file.

Surfaced while shipping trails#7822 (`has` → `isKey`), which is out of scope there.

## Acceptance criteria

- [ ] The accessor pair is declared where `parity:api` scores it against
      `isolated_execution_state.rb:7`, spelled `activeSupportExecutionState` /
      `setActiveSupportExecutionState` (CLAUDE.md: a Ruby `x=` that cannot be a TS
      `set` accessor keeps the Rails name as `setX()`).
- [ ] `parity:api` for `isolated_execution_state.rb` reaches 12/12; no new
      `parity:api:extra` novel surface in activesupport.
