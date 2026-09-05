---
title: "activemodel: Errors#delete returns Error objects where Rails returns the deleted messages"
status: in-progress
updated: 2026-09-05
rfc: "0134-activemodel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 7506
claim: "2026-09-05T02:22:17Z"
assignee: "flip-rack-deflater-onto-the-zlib-seam"
blocked-by: null
closed-reason: null
---

# `Errors#delete` returns Error objects where Rails returns the deleted messages

## Context

Spotted while converging `where` / `mergeBang` in PR #7396
(`errors-where-invented-branch-and-merge-bang-return`), reading the
neighbouring bodies in `vendor/rails/activemodel/lib/active_model/errors.rb`.

Rails (`errors.rb:215-221`):

```ruby
def delete(attribute, type = nil, **options)
  attribute, type, options = normalize_arguments(attribute, type, **options)
  matches = where(attribute, type, **options)
  matches.each do |error|
    @errors.delete(error)
  end
  matches.map(&:message).presence
end
```

`packages/activemodel/src/errors.ts`'s `delete` diverges on two points:

1. It returns `matches` — the `Error` objects — where Rails returns
   `matches.map(&:message)`, an array of message STRINGS. The doc comment
   above the Ruby is explicit: `person.errors.delete(:name) # => ["cannot be nil"]`.
2. It short-circuits `if (matches.length === 0) return null` before deleting,
   where Rails always runs the delete loop and lets `presence` turn the empty
   array into `nil` at the end. Same result today, different shape.

It also omits Rails' leading `normalize_arguments` call — Rails normalizes,
then calls `where`, which normalizes again. That third point is the
call-parity class (`pnpm parity:api:calls`), the other two are behavioural.

The existing `errors.test.ts` "delete" test asserts only `removed!.length`, so
it passes under either return type and did not catch this.

## Converged shape

Mirror errors.rb:215-221 line for line: normalize first, filter with `where`,
remove each match from `_errors`, and return
`matches.map((error) => error.message)` through the ActiveSupport `presence`
analogue so an empty result is null rather than `[]`.

## Acceptance criteria

- `delete` returns the deleted messages, not the `Error` objects, and `null`
  (via `presence`) rather than an empty array.
- The leading `normalizeArguments` call is present, as errors.rb:216 has it.
- Every call site of `Errors#delete` in the repo is updated for the new return
  type (grep first — `activerecord` and `actionview` both read errors).
- A regression test asserting the message array, failing on the baseline.
