---
title: "activemodel: attribute_method_prefix pops a trailing null as the keywords"
status: done
updated: 2026-10-05
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8544
claim: "2026-10-05T17:09:39Z"
assignee: "attribute-method-prefix-pops-a-trailing-null-as-the-keywords"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the reviewer on trails#8539.

`attributeMethodPrefix` and `attributeMethodSuffix`
(`packages/activemodel/src/attribute-methods.ts:160-187`) capture Ruby's `parameters:` keyword off
the splat with

```ts
const last = prefixes[prefixes.length - 1];
const { parameters = null } =
  typeof last === "object" ? (prefixes.pop() as { parameters?: string | null | false }) : {};
```

`typeof null === "object"`, so a trailing `null` is popped as the keywords and the destructure
throws `TypeError`. Rails binds it as a prefix:
`def attribute_method_prefix(*prefixes, parameters: nil)`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_methods.rb:106`, `:140` for the
suffix). MRI 3.3: `f(nil)` gives `prefixes == [nil]`, `parameters == nil`, and the pattern is built
with a nil prefix.

The arms extractor reads that conditional as a parameter binding through `isKwargsCapture`
(`scripts/api-compare/extract-ts-api.ts`), whose test is exactly `typeof last === "object"`. A null
check added to the body has to keep that rule matching, or the pair regains an invented `if`.

## Acceptance criteria

- [ ] A trailing `null` handed to `attributeMethodPrefix` / `attributeMethodSuffix` is a prefix /
      suffix, as `attribute_methods.rb:106,140` bind it, and does not throw.
- [ ] `pnpm parity:api:arms:report --package=activemodel` lists no invented arm for either pair.
- [ ] A test in the activemodel `.trails.test.ts` twin covers the `null` case.
