---
title: "naming-residue-burndown-actiondispatch-last"
status: ready
updated: 2026-10-18
rfc: "0167-actionpack-parity-gates"
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

Remainder of `naming-residue-burndown-actiondispatch-tail`. After it, `pnpm parity:api:calls:args:report`
still shows these actiondispatch burndown-class naming rows (TS under
`packages/actionpack/src/action-dispatch/`, Ruby under `vendor/rails/v8.0.2/actionpack/lib/action_dispatch/`):

- `middleware/exception-wrapper.ts` `sourceFragment`: Rails `extract_source_fragment_lines(file.each_line, line)`
  (`middleware/exception_wrapper.rb:335`); TS splits `file.read()`. ruby-compat `IO` has no `each_line`
  (`vendor/ruby/v3.3.11/io.c` `rb_io_each_line`).
- `middleware/exception-wrapper.ts` `SourceMapLocation#spot`: Rails passes `__getobj__`
  (`exception_wrapper.rb:239-249`; the class is `DelegateClass(Thread::Backtrace::Location)`, `:233`);
  TS holds a `location` field. Converge onto ruby-compat `DelegateClass`.
- `middleware/public-exceptions.ts` `render`: Rails `body.public_send("to_#{content_type.to_sym}")`
  guarded by `respond_to?` (`public_exceptions.rb:39-46`); TS hard-codes `JSON.stringify` / a local `toXml`.
- `middleware/static.ts` `isFileReadable`: `File.join(@root, path.b)` (`static.rb:145`). `String#b` is an
  encoding tag (root CLAUDE.md § "A String has no encoding tag either"), so this likely needs a
  `classifyPair` class in `scripts/api-compare/naming-taxonomy.ts` rather than a code change.
- `testing/integration.ts` `process`: `Http::Headers.from_hash(request_env).merge!(wrapped_headers)`
  (`integration.rb:277`); TS passes `wrappedHeaders.env` because `Headers#mergeBang`
  (`http/headers.ts:95`) only iterates a plain object, while Rails' `merge!` calls `each`
  (`http/headers.rb:112-116`) and TS `Headers#each` yields one `[key, value]` pair.

## Acceptance criteria

- Each row above is converged to the Rails identifier, or receipted with `@missingRailsName … — PERMANENT`
  where `classifyPair` files the pair permanent.
- `pnpm parity:api:calls:args:report` shows 0 burndown-class naming rows for actiondispatch.
