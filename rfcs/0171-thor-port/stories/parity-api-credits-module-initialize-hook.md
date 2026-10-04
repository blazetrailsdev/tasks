---
title: "parity:api credits a module's [initialize] hook as Ruby initialize"
status: ready
updated: 2026-10-04
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Thor::Shell#initialize` (`vendor/thor/v1.3.2/lib/thor/shell.rb:44-48`) is an `initialize` on a
module, which trails ports as the symbol-keyed `[initialize]` hook
(`packages/ruby-compat/src/include.ts`, `initialize` /
`initializeIncludedModules`). `packages/trailties/src/thor/shell.ts` seats it on the live
`Module` that way, and `parity:api --package thor` still reports

```text
shell.rb    shell.ts    19  1  0  20  95%
    - initialize → constructor
```

because `scripts/api-compare/extract-ts-api.ts` credits `initialize` only through a class
`constructor`. Three SKIP_GROUPS in `scripts/parity/conventions.ts` (`messages/rotator.rb`,
`api.rb`, `fixtures.rb`) already paper over the same shape with `tsMirrorName: "initialize"`,
one row per file.

## Acceptance criteria

- [ ] The extractor credits a module's `[initialize]` hook (object-literal key, class static, or
      the `(mod as …)[initialize] = function …` assignment a live `Module` uses) as Ruby
      `initialize` for that file.
- [ ] `parity:api --package thor` reads `shell.rb` 20/20 with no SKIP_GROUPS row added.
- [ ] Each existing `tsMirrorName: "initialize"` SKIP_GROUPS row whose port is a `[initialize]`
      hook is deleted.
