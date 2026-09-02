---
title: "send_file_headers! raises TypeError where Rails raises ArgumentError"
status: draft
updated: 2026-09-02
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `send_file_headers!` raises `ArgumentError` twice
(`vendor/rails/actionpack/lib/action_controller/metal/data_streaming.rb:127-146`):

```ruby
raise ArgumentError, ":type option required" if content_type.nil?

if content_type.is_a?(Symbol)
  extension = Mime[content_type]
  raise ArgumentError, "Unknown MIME type #{options[:type]}" unless extension
```

trails raises `TypeError` for both
(`packages/actionpack/src/action-controller/metal/data-streaming.ts:72,79`):

```ts
throw new TypeError(":type option required");
...
throw new TypeError(`Unknown MIME type ${String(options.type)}`);
```

The messages match; the class does not. `ArgumentError` is available from
`@blazetrails/ruby-compat` and is already used across actionpack, so this is a
spelling slip rather than a missing type. `send_file_test.rb` exercises both
raises, so the tests assert the wrong class too.

## Converged shape

Both `throw`s become `ArgumentError`, keeping the messages verbatim, and the
two `send-file.test.ts` assertions move onto that class without renaming the
tests.

## Acceptance criteria

- Both raise sites in `metal/data-streaming.ts` use `ArgumentError`
  (`data_streaming.rb:134`, `data_streaming.rb:138`).
- The `send-file.test.ts` assertions check `ArgumentError`, names unchanged.
- No other `TypeError` in `action-controller/` stands in for a Ruby
  `ArgumentError`; if one does, converge it here or name it.
