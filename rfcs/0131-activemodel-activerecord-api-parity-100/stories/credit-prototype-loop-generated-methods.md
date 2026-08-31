---
title: "Credit the name-array prototype loop that ports Rails' class_eval generator so command_recorder's 43 faithful methods stop scoring missing"
status: draft
updated: 2026-08-31
rfc: "0131-activemodel-activerecord-api-parity-100"
cluster: null
packages:
  - activerecord
deps: []
deps-rfc: []
est-loc: 220
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`migration/command_recorder.rb` is the second-largest single gap in
activerecord — 42/85, 43 missing — and trails' port is the faithful one.

Rails generates the whole recorder surface from a name array:

```ruby
ReversibleAndIrreversibleMethods.each do |method|
  class_eval <<-EOV, __FILE__, __LINE__ + 1
    def #{method}(*args, &block)
      record(:"#{method}", args, &block)
    end
  EOV
  ruby2_keywords(method)
end
```

(`vendor/rails/activerecord/lib/active_record/migration/command_recorder.rb:125-132`,
array at `:48`.)

trails writes the same loop over `REVERSIBLE_AND_IRREVERSIBLE_METHODS`
(`packages/activerecord/src/migration/command-recorder.ts:674` for the array,
`:720-731` for the assignment onto `CommandRecorder.prototype`, including the
`if (method in CommandRecorder.prototype) continue;` guard that lets the
hand-written reversible arms above it win).

`extract-ruby-api.rb` credits Rails' macro; `extract-ts-api.ts` cannot see a
prototype assignment, so all 43 report missing. **Hand-writing 43 methods here
would make the port less faithful than it is now, and this story must not do
it.** The fix is the extractor arm, exactly as RFC 0130's
`define_model_callbacks` story fixes the mirror-image blind spot on the Ruby
side.

The two `alias`es Rails adds next to the loop (`add_belongs_to`,
`remove_belongs_to`, `command_recorder.rb:133-134`) already match and are not
part of this story.

## Acceptance criteria

- `extract-ts-api.ts` credits members assigned to `<Class>.prototype[name]` in
  a `for … of <CONSTANT_ARRAY>` loop, where the array is a same-file
  const of string literals, as bodied members of that class.
- A test in `scripts/api-compare/` pins the positive case AND the negatives:
  a loop over a non-literal or imported array, or over a computed name, credits
  nothing. A too-generous arm would let any dynamic assignment invent coverage
  package-wide.
- activerecord `migration/command_recorder.rb` reaches **85/85**; package total
  ≥ **6203/6362** (from 6160).
- `packages/activerecord/src/migration/command-recorder.ts` keeps its loop —
  the diff contains no hand-expanded recorder method.
- Effect on every other package reported in the PR body; marks move only via
  `:tighten`.

## Definition of done

Expanding `REVERSIBLE_AND_IRREVERSIBLE_METHODS` into 43 hand-written methods does not close this story. It would move the number and make the port less faithful than Rails' own `class_eval` loop.

## Verification

```sh
pnpm build
API_COMPARE_FORCE=1 pnpm parity:api
pnpm vitest run scripts/api-compare/
```

Read the `migration/command_recorder.rb` row. `git diff -- packages/` must be
empty.
