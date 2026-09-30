---
title: "Port Actions#vendor/lib/rakefile/initializer and their actions_test.rb tests"
status: draft
updated: 2026-09-30
rfc: "0142-trailties-surfaced-deviations"
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

`Rails::Generators::Actions` defines four file-writing actions that
`packages/trailties/src/generators/actions.ts` does not port:
`vendor` (`vendor/rails/v8.0.2/railties/lib/rails/generators/actions.rb:258-262`),
`lib` (`:275-279`), `rakefile` (`:302-306`) and `initializer` (`:319-323`).
All four have the same shape:

```ruby
def initializer(filename, data = nil)
  log :initializer, filename
  data ||= yield if block_given?
  create_file("config/initializers/#{filename}", optimize_indentation(data), verbose: false)
end
```

trails already has `log` and `optimizeIndentation` in `actions.ts` and
`createFile` in `generators/base.ts:779`.

Their eight tests in `vendor/rails/v8.0.2/railties/test/generators/actions_test.rb:357-417`
(`test_vendor_should_write_data_to_file_in_vendor` …
`test_initializer_should_write_date_to_file_with_block_in_config_initializers`)
are missing from `packages/trailties/src/generators/actions.test.ts`. The two
initializer tests are the only Rails callers of `assert_initializer`, which
trails#8265 ported to `generators/testing/assertions.ts` as `assertInitializer`;
nothing in trails calls it yet.

## Acceptance criteria

- `vendor`, `lib`, `rakefile` and `initializer` are ported into `actions.ts`
  in Rails member order, with the Rails body: `log`, then the block fallback
  (`data ??= block()` only when a block is given), then `createFile` of
  `optimizeIndentation(data)` with `verbose: false`.
- The eight `actions_test.rb:357-417` tests are ported under their Rails names.
  The initializer tests assert through `assertInitializer`, and the others
  through `assertFile`.
