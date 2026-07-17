---
title: "residual-node-handlers"
status: closed
updated: 2026-07-17
rfc: "0065-prism-codegen"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Spike PR #4912 closed — deterministic codegen not useful enough for the backlog; direction abandoned."
---

## Context

`pnpm codegen:generate` reports 22 residual passthrough node instances across
the 10 files (see `docs/infrastructure/prism-codegen-spike.md`). Leaders:
`RequiredParameterNode` in block/lambda contexts (8), `InterpolatedSymbolNode`
(2), `SourceFileNode`/`SourceLineNode` (`__FILE__`/`__LINE__`),
`ForwardingArgumentsNode` (`...`), `LambdaNode`, `MatchWriteNode`,
`InterpolatedRegularExpressionNode`, back/numbered references.

## Acceptance criteria

- Add handlers for the residual kinds above (block/lambda params via
  BlockParametersNode, `LambdaNode` → arrow fn, `ForwardingArgumentsNode` →
  `...args`, interpolated symbol/regex).
- Rollup passthrough drops to < 5 node instances across the 10 files.
- Coverage table in the RFC updated.
