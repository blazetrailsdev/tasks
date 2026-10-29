---
title: "api-compare: credit a class expression inside a conditional static initializer"
status: draft
updated: 2026-10-29
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`extract-ts-api.ts` credits a nested Ruby class written as a static class expression (`static Cache = class Cache {…}`), but it does not see one inside a conditional expression. mini_mime defines `PReadFile` conditionally (`vendor/mini_mime/v1.1.5/lib/mini_mime.rb:91-113`: `if ::File.method_defined?(:pread) PReadFile = ::File else class PReadFile … end`). trails ports it as `static PReadFile = rbModMethodDefined(File, "pread") ? File : class PReadFile {…}` (`packages/mini-mime/src/mini-mime.ts`, trails#9451). As a result `parity:api` reports `readline` and `pread` missing (mini-mime 21/23), and `parity:class-paths` leaves `MiniMime::Db::PReadFile` out of the table.

## Acceptance criteria

- The TS extractor descends into each branch of a conditional (`?:`) initializer on a static field and credits a class expression found there to the field's Ruby constant path.
- `pnpm parity:api --package mini-mime` reports 23/23.
- A unit test in `scripts/api-compare/` covers the conditional class-expression shape.
