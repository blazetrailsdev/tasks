---
title: "parity:lint:counts ratchets as-unknown-as in activerecord and actionpack lib"
status: draft
updated: 2026-11-16
rfc: "0000-activerecord-actionpack-type-polish"
cluster: type-polish-gates
packages: [activerecord, actionpack]
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

`pnpm parity:lint:counts` (`scripts/parity/eslint-count.ts`) counts
`no-explicit-any` warnings per file against `origin/main` for
`packages/activerecord/{lib,test}` (`eslint.config.mjs`, RFC 0037 block).
Nothing counts `as unknown as`: activerecord `lib/` has 202 and actionpack
`lib/` has 117, and either can grow without a red. actionpack `lib/` is also
outside the `no-explicit-any` count and the `blazetrails/no-explicit-any-disable`
rule.

## Acceptance criteria

- [ ] `parity:lint:counts` counts `as unknown as` per file in
      `packages/activerecord/lib` and `packages/actionpack/lib`, only-shrink
      against `origin/main`, a new file with one is red.
- [ ] actionpack `lib/` joins the `no-explicit-any` count and
      `no-explicit-any-disable`.
- [ ] A unit test for the counter covers a file that grows, shrinks and is new.

## Definition of done

Adding a mark file or allowlist does not close this story: the base tree is
the mark.
