---
title: "naming-residue-burndown-actiondispatch-tail"
status: ready
updated: 2026-10-18
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Remainder of `naming-residue-burndown-actiondispatch-remainder`. `pnpm parity:api:calls:args:report` still shows these actiondispatch burndown-class naming rows (paths under `packages/actionpack/src/action-dispatch/`, Ruby under `vendor/rails/v8.0.2/actionpack/lib/action_dispatch/`):

- `journey/path/pattern.ts` to_regexp: Rails `regexp_visitor.new(@separators, @requirements)` (`journey/path/pattern.rb:173-175`); TS builds `new Klass(this._separators, this.requirements, this.names)`. The extra `names` argument (flags) has no Rails counterpart.
- `middleware/debug-locks.ts` render_details: Rails passes `threads.values` to `blocked_by?` (`debug_locks.rb:94,98`); TS passes a hoisted `allInfos`. `blockedBy` needs an iterable `all?`; the TS lib in use has no iterator helpers.
- `middleware/exception-wrapper.ts`: `each_line` vs `split` (extract_source_fragment_lines); `__getobj__` vs `location` (spot, translate_location).
- `middleware/public-exceptions.ts` render: Rails `body.public_send("to_#{content_type.to_sym}")` (`public_exceptions.rb:39-46`); TS hard-codes `JSON.stringify` / `toXml`.
- `middleware/static.ts` file_readable?: `File.join(@root, path.b)` (`static.rb:145`).
- `routing/mapper.ts` check_via: `Array(...)` vs `kernelArray(...)` (`mapper.rb:1983`).
- `routing/url-for.ts` handle_string_call / handle_class_call / handle_model_call: module-mixin-receiver (`target` parameter for `self`).
- `testing/integration.ts` process: `Http::Headers.from_hash(request_env).merge!(wrapped_headers)` (`integration.rb:277`); TS passes `wrappedHeaders.env` because `Headers#mergeBang` takes only a plain object.

## Acceptance criteria

- Each row above is converged to the Rails identifier, or receipted with `@missingRailsName … — PERMANENT` where `classifyPair` files the pair permanent.
- `pnpm parity:api:calls:args:report` shows none of the `pattern.ts`, `debug-locks.ts` or
  `mapper.ts` `check_via` burndown rows. The exception-wrapper, public-exceptions, static and
  integration rows moved to `naming-residue-burndown-actiondispatch-last`.
