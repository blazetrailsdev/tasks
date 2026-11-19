---
title: "Close backlog stories that propose snake_case like Rails (falsified by the casing rule)"
status: draft
updated: 2026-11-19
rfc: "0208-predicate-and-underscore-naming"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10336 ratified in CLAUDE.md § "Fidelity is the job" that casing is translated to Node spelling, never mirrored. A difference that is only snake_case vs kebab-case or camelCase is not a deviation. The first story to violate this, `generator-namespace-is-snake-case-like-rails`, shipped a snake_case conversion in trails#10329 that then had to be reverted. That story is closed FALSIFIED.

Other open or draft stories may share its premise. `pnpm tasks list | grep -i snake` on 2026-11-18 returns candidates such as `thor-cli-names-are-kebab-case-accept-snake-case-input`, `thor-encoded-instruction-sends-snake-case-name-verbatim`, `serialization-reads-snake-case-serialization-keys` and `assertion-comparer-normalizes-snake-vs-camel-attribute-literals`. Some of these move toward Node casing and are fine. The rest are not.

## Acceptance criteria

- Every open, draft or ready story whose goal is to make a trails name, key or namespace snake_case "like Rails" is closed with `pnpm tasks close <id> "FALSIFIED: CLAUDE.md casing rule (trails#10336)"`.
- Stories that converge toward Node casing, or that fix a real behaviour difference, stay open.
- The list of stories closed and kept is recorded in this story's closing reason.
