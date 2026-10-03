---
title: "activesupport: delete hwia-extended.test.ts; its JsonGemEncodingTest bodies are invented duplicates"
status: draft
updated: 2026-10-03
rfc: "0101-activesupport-out-of-closure-surface"
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

Found while converting the callback tests in trails PR 8457.

`packages/activesupport/src/hwia-extended.test.ts` has no Rails counterpart. After PR 8457 removed its duplicate callback tests it holds one `describe("JsonGemEncodingTest")` with two tests that call native `JSON.stringify` / `JSON.parse` on plain values and exercise no trails code:

- `encodes primitives correctly` is not a Rails test name.
- `custom to_json (toJSON override)` rewords Rails' `test "custom to_json"` (`vendor/rails/v8.0.2/activesupport/test/core_ext/object/json_gem_encoding_test.rb:37`, counted from the class at `:20`).

The Rails-mirrored home, `packages/activesupport/src/core-ext/object/json-gem-encoding.test.ts`, already carries `it.skip("custom to_json")` for the same Rails test, so the hwia copy is a second, non-faithful body under the wrong file.

## Acceptance criteria

- [ ] `packages/activesupport/src/hwia-extended.test.ts` is deleted.
- [ ] If `custom to_json` is portable, its body lands in `core-ext/object/json-gem-encoding.test.ts` following `json_gem_encoding_test.rb`, replacing the `it.skip`; otherwise the skip stays as it is.
- [ ] `pnpm parity:test` delta for activesupport is non-negative.
