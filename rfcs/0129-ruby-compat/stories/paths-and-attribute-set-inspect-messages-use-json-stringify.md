---
title: "Ported inspect messages spell f.inspect as JSON.stringify instead of ruby-compat's rbInspect"
status: ready
updated: 2026-09-05
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 12
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rails::Paths::Path#existent` (`vendor/rails/railties/lib/rails/paths.rb:219-229`)
raises

```ruby
raise "File #{f.inspect} is a symlink that does not point to a valid file"
```

`packages/trailties/src/paths.ts`'s `existent` spells `f.inspect` as
`JSON.stringify(f)` (landed in PR #7485). That renders the same string for an
ordinary path, but it is not `rb_str_inspect` (`vendor/ruby/string.c`): the two
diverge on the escapes Ruby renders and JSON does not — `\e`, `\a`, `\v`, a
`#{`/`#$`/`#@` sequence, and a non-ASCII byte, which Ruby emits as `\xNN` for a
binary string.

ruby-compat already exports the right function: `rbInspect`, which answers
`"\"/foo/bar.rb\""` for a string and is what ~20 call sites across activemodel,
activerecord, activesupport and actionpack already import
(`rbInspect as inspect`).

`JSON.stringify` also stands in for `inspect` at
`packages/activemodel/src/attribute-set.ts`'s `fetch` — Ruby's
`KeyError` message is `key not found: #{key.inspect}`
(`vendor/ruby/hash.c` `rb_hash_fetch_m`) — so the sweep is worth doing across
both sites, not just the one PR #7485 touched.

## Converged shape

`import { rbInspect } from "@blazetrails/ruby-compat"` in both files, and

```ts
throw new Error(`File ${rbInspect(f)} is a symlink that does not point to a valid file`);
```

Check the rest of the repo for the same stand-in with
`git grep -n 'JSON.stringify' -- 'packages/*/src/**/*.ts' | grep -i 'inspect\|not found\|Error('`
and convert every site whose Ruby counterpart calls `inspect`.

## Acceptance criteria

- `paths.ts`'s symlink message and `attribute-set.ts`'s `fetch` `KeyError`
  message go through `rbInspect`, not `JSON.stringify`.
- Any other `JSON.stringify` standing in for a Ruby `inspect` in a ported
  message is converted, or listed here as out of scope with its reason.
- `paths.test.ts`'s "A failed symlink is still a valid file" and the
  `AttributeSet` fetch tests keep their names and pass.
