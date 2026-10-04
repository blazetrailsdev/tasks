---
title: "Thor::Command#handle_argument_error? counts rbFSend's frames, so a body's own top-frame ArgumentError is re-raised"
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

`Thor::Command#handle_argument_error?` (`vendor/thor/v1.3.2/lib/thor/command.rb:119-124`) hands an
`ArgumentError` to `handle_argument_error` when `sans_backtrace(error.backtrace, caller)` is empty
or has one frame. In Ruby, `instance.__send__(name, *args)` (`command.rb:29`) pushes no frame of
its own, so an arity-like `ArgumentError` raised in the command body's own top frame has exactly
one frame outside Thor and is handled.

trails ports the test literally (trails#8414, `packages/trailties/src/thor/command.ts`
`isHandleArgumentError` / `sansBacktrace`), over `excBacktraceLocations(error)` and `rbFCaller()`.
But `rbFSend` adds two V8 frames (`sendInternal`, `rbFSend`, `packages/ruby-compat/src/object.ts`),
so the same error has three frames here and is re-raised. Verified against the built `dist` under
plain node: a body `top() { throw new ArgumentError("wrong number of arguments (given 1, expected 2)") }`
is re-raised, where Thor prints the usage error.

`rbCheckArity` already re-seats its error's stack at its caller with `Error.captureStackTrace`
(`packages/ruby-compat/src/method.ts`), the way `raise_argument_error`
(`vendor/ruby/v3.3.11/vm_args.c:777`) takes the backtrace at the call. The send frames need the
same treatment: MRI's `vm_call_opt_send` dispatches without a frame.

A second gap in the same reading: `Location` (`packages/ruby-compat/src/backtrace-location.ts`)
parses V8 frames only, and `Command.FILE_REGEXP` is spelled for a V8 frame. On an engine with
another stack format (Firefox, Safari) every frame is dropped by `excBacktraceLocations`'s
`/^\s+at\s/` filter, so `saned` is empty and every arity-like `ArgumentError` is handled.

## Acceptance criteria

- [ ] An arity-like `ArgumentError` raised in a command body's own top frame reaches
      `handle_argument_error`, as `command.rb:119-124` does; one raised a frame deeper is still
      re-raised. Cover both in `packages/trailties/src/thor/command.trails.test.ts`, from a file
      outside `src/thor/` (frames under that directory are filtered by `FILE_REGEXP`).
- [ ] The frames `rbFSend` adds do not count, by the backtrace reading (an
      `Exception#backtrace` port that omits ruby-compat's dispatch frames) rather than by a Thor-side filter
      Rails does not have.
- [ ] Decide and record what a non-V8 stack answers; do not leave it as "handled by accident".
