---
title: "test-compare: the Ruby extractor drops RSpec context and top-level constant describe from the describe path"
status: draft
updated: 2026-10-02
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8402, which enrolled `bcrypt-ruby`'s RSpec suite in `parity:test`.
`scripts/test-compare/extract-ruby-tests.rb` builds a test's describe path from `describe "string"`
blocks only (`process_method_add_block`, the `when "describe"` arm). Two RSpec forms are dropped from
the path, so the ported TS file has to nest the way the extractor reports instead of the way the spec
reads:

1. **`context "..." do`** is not read as a describe at all. `vendor/bcrypt-ruby/v3.1.20/spec/bcrypt/engine_spec.rb:6`
   (`context 'a tiny upper time limit provided' do`) is flattened away, and
   `packages/bcrypt/src/engine.test.ts` had to drop that `describe` to match. Thirteen spec files under
   `vendor/thor/v1.3.2/spec` and `vendor/rack-test/v2.2.0/spec` use `context`
   (`grep -rlE "^\s*context " vendor/thor/v1.3.2/spec vendor/rack-test/v2.2.0/spec`).
2. **A top-level constant-form `describe`** (`describe Thor::Actions do`) contributes no segment.
   trails#8402 made a constant `describe` push its name only when NESTED inside another describe
   (`desc ||= const_name_from_args(inner[2]) unless @describe_stack.empty?`), to leave thor's and
   rack-test's paths as they were.

Both are measurement gaps, not port gaps: RSpec treats `context` as an alias of `describe`, and a
constant describe names its group by the constant.

## Acceptance criteria

- [ ] `context` pushes onto the describe stack exactly as `describe` does, with an extractor test in `scripts/test-compare/`.
- [ ] A top-level constant-form `describe` pushes the constant's name; the `unless @describe_stack.empty?` guard is gone.
- [ ] The thor, rack-test and bcrypt TS test files are re-nested to match, so `pnpm parity:test`'s matched counts and `wrong describe` total are no worse than before the change (state both numbers in the PR body).
- [ ] `packages/bcrypt/src/engine.test.ts` carries the `a tiny upper time limit provided` describe again.

## Verification

```bash
pnpm parity:test && pnpm parity:test:assertions && pnpm vitest run scripts/test-compare
```
