---
title: "detect_negative_enum_conditions! warns with a trails-only message, no logger guard, and an invented camelCase arm"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `enum_test.rb`'s assertions in PR #7858. RFC 0050's
`enum-negative-scope-warn-not-raise` (trails#4415) converted this case from a
raise to a warning and wired `detectNegativeEnumConditionsBang`; it did not
converge the warning itself, and RFC 0050 is now closed.

Rails, `activerecord/lib/active_record/enum.rb:398-408`:

```ruby
def detect_negative_enum_conditions!(method_names)
  return unless logger

  method_names.select { |m| m.start_with?("not_") }.each do |potential_not|
    inverted_form = potential_not.sub("not_", "")
    if method_names.include?(inverted_form)
      logger.warn "Enum element '#{potential_not}' in #{self.name} uses the prefix 'not_'." \
        " This has caused a conflict with auto generated negative scopes." \
        " Avoid using enum elements starting with 'not' where the positive form is also an element."
    end
  end
end
```

trails, `packages/activerecord/src/enum.ts` `detectNegativeEnumConditionsBang`
and its private `normalizeNegativeEnumPositiveForm`, diverges on four counts:

1. **The message is a different string entirely** — `Enum uses prefix '<prefix>'
which conflicts with auto-generated negative scope '<notMethod>' while
positive form '<positiveForm>' also exists.` It names neither the element nor
   the model, where Rails names both (`#{potential_not}`, `#{self.name}`).
2. **`return unless logger` is missing.** Rails emits nothing when the model has
   no logger; trails always warns.
3. **It writes through a module-level `_enumWarn` seam (`setEnumWarn`) rather
   than `logger.warn`.** Rails has no such seam; the sink is the model's logger.
4. **It carries a trails-only `not` + CamelCase arm.** Rails selects only
   `m.start_with?("not_")` and strips with `sub("not_", "")`; trails also matches
   a bare `not` followed by an uppercase letter (`notSent` -> `sent`), a prefix
   Rails never generates.

The cost is assertion-VALUE parity: `enum_test.rb`'s three warning tests assert
Rails' exact `expected_message_1` string, so their trails counterparts can only
ever assert a trails-only string. PR #7858 had to hoist that string into a local
rather than port Rails' literal.

## Converged shape

Port the body as Rails writes it: the `return unless logger` guard, the
`start_with?("not_")` select with `sub("not_", "")`, and Rails' message verbatim
with the element name and `self.name` interpolated. Retire
`normalizeNegativeEnumPositiveForm`'s camelCase arm and the `_enumWarn` /
`setEnumWarn` seam if nothing outside the tests needs it; the three
`enum_test.rb` warning tests then assert Rails' literal, and
`enum.trails.test.ts`'s `setEnumWarn`-based cases move onto whatever the logger
double is.

## Acceptance criteria

- [ ] `detectNegativeEnumConditionsBang` mirrors `enum.rb:398-408` line for line:
      the logger guard, the `not_` select, and the message.
- [ ] No `not` + CamelCase arm; only Rails' `not_` prefix is detected.
- [ ] The three `enum_test.rb` warning tests assert Rails' message literal, not a
      trails-local string, and `enum_test.rb` stays at 0 assertion-count,
      0 assertion-kind and 0 assertion-value mismatches.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:extra:gate` green.
