---
title: "test-compare: expand class_eval heredoc loops that define test methods (relations_test.rb's 15 no-arguments tests)"
status: done
updated: 2026-10-13
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8868
claim: "2026-10-13T19:12:29Z"
assignee: "activerecord-test-case-remaining-members-and-one-test-object"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activerecord/test/cases/relations_test.rb:562-570` generates fifteen tests from a heredoc:

```ruby
%w( references includes preload eager_load group order reorder reselect unscope
    joins left_joins left_outer_joins optimizer_hints annotate regroup ).each do |method|
  class_eval <<~RUBY
    def test_no_arguments_to_#{method}_raise_errors
      error = assert_raises(ArgumentError) { Topic.#{method}() }
      assert_equal "The method .#{method}() must contain arguments.", error.message
    end
  RUBY
end
```

`scripts/test-compare/extract-ruby-tests.rb` expands a literal-array loop only when its body holds
`define_method` (`process_define_method_loop`, `:825`) or the `test` macro (`process_test_macro_loop`, `:889`).
A `class_eval` of a heredoc is a string to Ripper, so the fifteen tests are never extracted, and their ports
(`packages/activerecord/src/relations.test.ts`, the `noArgGuardedMethods` loop near the end of the
`RelationTest` describe) count as 15 extra (TS only). They are Rails tests under Rails' names and must stay in
`relations.test.ts`; they are the only extras left in that file.

The same shape is at `activesupport/test/inflector_test.rb:478` and
`activesupport/test/multibyte_chars_test.rb:112`.

## Acceptance criteria

- [ ] The Ruby extractor expands a literal-array loop whose body is `class_eval` of a heredoc defining `def test_*`, binding the block variable into the heredoc and extracting each generated method's name and assertions; a loop it cannot expand is reported as the `define_method` one is.
- [ ] A case in `scripts/test-compare/extract-ruby-define-method.test.ts` (or a sibling) covers the `relations_test.rb:562-570` shape.
- [ ] `relations_test.rb` reports 0 extra and 15 more matched tests in `pnpm parity:test`; no package's matched count drops.

## Verification

```bash
pnpm parity:test --package activerecord --sort-extra --min-extra=1
```
