---
title: "serialization-error-carries-rescued-cause"
status: draft
updated: 2026-10-21
rfc: "0169-activejob-package-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `Arguments#convert_to_global_id_hash`
(`vendor/rails/v8.0.2/activejob/lib/active_job/arguments.rb:190-195`) raises
`SerializationError` inside `rescue URI::GID::MissingModelIdError`. Ruby's
`raise` in a `rescue` sets the new exception's `cause` to `$!`, so the
`SerializationError` carries the `MissingModelIdError` as its `cause`.

trails' `convertToGlobalIdHash` (`packages/activejob/src/arguments.ts:263-276`
on main) throws `new SerializationError(...)` from the `catch` with no cause.
The rescued error is lost.

CLAUDE.md § "`$!` is passed explicitly" settles the shape:
`excSetupMessage(error, errinfo)` from `@blazetrails/ruby-compat`, as
`packages/activerecord/src/migration.ts:1864` does.

The Ruby-to-TS generator's activejob trial surfaced this (branch
`spike-ar-ruby-ir-ts-29583a`). The generated code sets the cause. The trails
test "raises SerializationError for a record without an id" compares errors
with vitest, which checks `cause`, so it fails against the faithful output.

## Acceptance criteria

- `convertToGlobalIdHash` throws
  `excSetupMessage(new SerializationError(msg), error)`, so the error's `cause`
  is the rescued `MissingModelIdError`.
- The test asserts the `cause`, and it fails before the fix.
- Audit the other `rescue … raise` sites in `packages/activejob/src` for the
  same drop, and converge each in this story.
- `pnpm parity:api:calls` shows no new rows.
