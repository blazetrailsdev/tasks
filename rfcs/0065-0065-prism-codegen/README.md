---
rfc: "0065-0065-prism-codegen"
title: "Prism-driven deterministic AR Ruby → trails JS codegen"
status: draft
created: 2026-07-16
updated: 2026-07-16
owner: "@your-handle"
packages:
  - "activerecord"
clusters:
  - "tooling"
---

Spike proving a deterministic (no-LLM) Prism-AST → JavaScript translator for
ActiveRecord Ruby source, following the repo's existing Ruby→JS conventions
(`scripts/api-compare/conventions.ts`). Tool lives at `scripts/prism-codegen/`.

Design doc: `docs/infrastructure/prism-codegen-spike.md` (trails repo).

The spike PR ships the extensible handler-registry generator, the
`pnpm codegen:generate` / `pnpm codegen:from-ts` scripts, and the coverage
metric (99.8% of AST node instances handled across the 10 most-central AR
files). This epic tracks the productionization roadmap: closing the gap between
node-handler coverage and semantic correctness (receiver resolution, async
inference, macro-DSL wiring, stdlib idioms).
