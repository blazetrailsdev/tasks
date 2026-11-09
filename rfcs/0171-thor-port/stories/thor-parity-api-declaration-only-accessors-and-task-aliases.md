---
title: "Thor parity:api: base.rb/actions.rb accessors and *_task aliases read as declaration-only (16 rows)"
status: in-progress
updated: 2026-11-09
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 3
pr: trails#9916
claim: "2026-11-09T13:20:31Z"
assignee: "port-help-and-version-commands-for-split-namespace"
blocked-by: null
closed-reason: null
---

## Context

Spec miss / regression found at the 2026-11-09 refine. `pnpm parity:api --package thor` on origin/main
(89f094d134) reads thor 486/504; 16 of the 18 misses are `[declaration-only]` rows for members the port
does define at run time:

- `base.rb` 57/71: `options`, `options=`, `parent_options`, `parent_options=`, `args`, `args=`
  (`packages/thor/lib/base.ts:192-193` `rbModAttrReader`/`rbModAttrWriter`, but `interface` fields at ~:98),
  and the deprecated `*_task` aliases `tasks`, `all_tasks`, `remove_task`, `no_tasks`, `public_task`,
  `handle_no_task_error`, `find_and_refresh_task`, `create_task` (`base.ts:395-411` typed as
  `undefined as unknown as …`, assigned at `:706-707`).
- `actions.rb` 19/21: `behavior`, `behavior=` (`actions.ts:76` interface field only).

`thor-base-module-attr-accessors-read-declaration-only` (trails#8541) and
`thor-base-task-aliases-and-actions-from-superclass-dispatch` are done, so these rows have regressed
(present before trails#9886's lib/ move too, so not caused by it).

## Acceptance criteria

- [ ] Each of the 16 members is a real, extractor-visible definition (port shape, not an interface
      declaration or an `undefined as unknown` placeholder), or the extractor credits the existing shape.
- [ ] `pnpm parity:api --package thor --missing` lists none of them; `base.rb` and `actions.rb` read 100%.
