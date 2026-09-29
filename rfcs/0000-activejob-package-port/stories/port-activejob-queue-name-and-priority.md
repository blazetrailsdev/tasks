---
title: "Port ActiveJob::QueueName and ActiveJob::QueuePriority"
status: draft
updated: 2026-09-29
rfc: "0000-activejob-package-port"
cluster: null
packages: ["activejob"]
deps: ["port-activejob-core"]
deps-rfc: []
est-loc: 300
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activejob/lib/active_job/queue_name.rb` (68 lines): `ClassMethods` with
`mattr_accessor :default_queue_name, default: "default"` (`:9`), `queue_as`
(`:39-45`), `queue_name_from_part` (`:47-51`); `included` with three
`class_attribute`s (`:54-58`); instance `queue_name` (`:61-66`).

`vendor/rails/v8.0.2/activejob/lib/active_job/queue_priority.rb` (60 lines): `ClassMethods` with
`mattr_accessor :default_priority` (`:9`) and `queue_with_priority` (`:39-45`);
`included` with `class_attribute :priority, default: default_priority`
(`:48-50`); instance `priority` (`:53-58`).

`Base` gains `include QueueName` / `include QueuePriority` (`base.rb:66-67`).
Tests: `port-activejob-queue-naming-and-priority-tests`.

## Fidelity traps (predicted at authoring)

- [ ] **`mattr_accessor` on `ClassMethods`** (`queue_name.rb:9`, `queue_priority.rb:9`) is one module-level value shared by every job class, not a per-class `class_attribute`.
- [ ] **Proc-valued `class_attribute`.** `queue_name`'s default is a lambda (`:55`), and `queue_as { … }` stores the block itself (`:41`). The class attribute holds the Proc; the instance reader `instance_exec`s it with the job as `self` and memoizes (`:62-64`). Port the block as a `this`-typed function called with the job.
- [ ] **Symbol queue names.** `queue_as :low_priority` passes a Symbol; `name_parts.compact.join` (`:50`) calls `to_s`, dropping the colon. With Symbols as `":name"` strings, `queue_name_from_part` must strip the colon for the Symbol arm and keep a String as-is. Both arms have tests.
- [ ] **`queue_name_prefix.presence`** (`:49`) is activesupport `presence`: a blank prefix is dropped.
- [ ] **`default: default_priority` is read once, at `included` time** (`queue_priority.rb:49`): later changes to `default_priority` do not reach `priority`'s class default. Keep that.
- [ ] **`queue_with_priority(priority = nil, &block)`** stores the block (`:41`) and `priority` `instance_exec`s it (`:54-56`), as for `queue_as`.

## Acceptance criteria

- [ ] Both files read complete in `parity:api`.
- [ ] `class_attribute`s use activesupport's `classAttribute()` (reads walk the chain, writes are local); there is no `inherited` hook (CLAUDE.md § "`inherited` is deferred").

## Definition of done

A hand-rolled `inherited` hook, or copy-on-first-write statics, does not close this story.
