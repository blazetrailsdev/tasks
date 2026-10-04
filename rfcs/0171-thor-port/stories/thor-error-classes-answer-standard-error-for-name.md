---
title: "Thor error classes answer StandardError for their class name"
status: ready
updated: 2026-10-04
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8341. `packages/trailties/src/thor/error.ts` declares `Thor::Error` and its subclasses as plain `class X extends StandardError`. None sets a Ruby class name, so `new Error("x").name` and `new UndefinedCommandError(...).name` both answer `"StandardError"`, inherited from `StandardError.prototype.name` (`packages/ruby-compat/src/standard-error.ts:13`). Ruby answers `Thor::Error`, `Thor::UndefinedCommandError`, … for `error.class.name`, and a message-less `Thor::Error.new.message` is `"Thor::Error"` (`vendor/thor/v1.3.2/lib/thor/error.rb:20-21`; `vendor/ruby/v3.3.11/error.c` `exc_to_s`, the nil-`mesg` arm).

Other trails errors name themselves (`this.name = "ActiveRecord::AssociationNotFoundError"`, `packages/activerecord/src/associations/errors.ts`), or set `X.prototype.name` as ruby-compat's do.

Related: `ruby-compat-exception-message-dispatches-to-to-s` and `standard-error-message-does-not-default-to-class-name` (RFC 0154) own the message side.

## Acceptance criteria

- Each class in `packages/trailties/src/thor/error.ts` answers its Ruby class name (`Thor::Error`, `Thor::UndefinedCommandError`, `Thor::AmbiguousCommandError`, `Thor::InvocationError`, `Thor::UnknownArgumentError`, `Thor::RequiredArgumentMissingError`, `Thor::MalformattedArgumentError`, `Thor::ExclusiveArgumentError`, `Thor::AtLeastOneRequiredArgumentError`), in the shape the rest of `packages/trailties/src/thor/` settles on for `Thor::*` constants.
- `error.trails.test.ts` asserts the names.
