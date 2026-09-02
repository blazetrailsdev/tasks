---
title: "Flip activerecord and activerecord-cli's File/Dir call sites off getFs/getPath"
status: draft
updated: 2026-09-02
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: ["activerecord", "activerecord-cli"]
deps: ["port-file-and-dir-classes-onto-the-fs-backend"]
deps-rfc: []
est-loc: 350
priority: 7
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

One link in RFC 0135's flip chain: repoint `packages/activerecord/src and packages/activerecord-cli/src` from
`getFs()` / `getPath()` to `File` / `Dir`. Mechanical once
`port-file-and-dir-classes-onto-the-fs-backend` has landed the classes — the
chain is split per package purely because `File` is 1415 Rails calls and does
not fit one PR.

Measured 2026-09-02: **18 files, 195 member calls (activerecord 17/164, cli 1/31)**.

The flips are import-specifier and member-name changes only; no call changes
shape and no behaviour changes. Where a body was open-coding a Ruby operation
across several node calls (an `existsSync` guard around a `mkdirSync`, say),
converge it to the single Ruby member Rails calls — that is the fidelity the
RFC is for, and it is the one place a flip is not purely mechanical.

The exemption does not move in this story. `File` and `Dir` leave
`CORE_CLASS_RECEIVERS` only in
`unexempt-file-and-dir-from-core-class-receivers`, which deps on every link.

## Acceptance criteria

- No `getFs()` or `getPath()` call remains in `packages/activerecord/src and packages/activerecord-cli/src`; a grep for
  `existsSync`, `readFileSync`, `writeFileSync`, `unlinkSync` and
  `statSync` in that tree returns nothing outside tests that are exercising the
  backend itself.
- `pnpm parity:api:calls` and `pnpm parity:api:calls:args` show no new rows;
  any row that converges is deleted by hand and its mark tightened with
  `pnpm parity:api:calls:tighten`, never reseeded.
- The package's own test files run green without a bespoke fs stub.
