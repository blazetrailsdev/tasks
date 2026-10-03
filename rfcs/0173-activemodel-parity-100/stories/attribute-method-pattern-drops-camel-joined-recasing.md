---
title: "activemodel: AttributeMethodPattern holds Rails' @regex / @method_name with no camelJoined re-casing"
status: draft
updated: 2026-10-03
rfc: "0173-activemodel-parity-100"
cluster: null
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_methods.rb:476-493`:

    @regex = /\A(?:#{Regexp.escape(@prefix)})(.*)(?:#{Regexp.escape(@suffix)})\z/
    @method_name = "#{prefix}%s#{suffix}"
    def match(method_name)
      if @regex =~ method_name
        AttributeMethod.new(proxy_target, $1)
      end
    end
    def method_name(attr_name)
      @method_name % attr_name
    end

`packages/activemodel/src/attribute-methods.ts`'s `AttributeMethodPattern` has an invented
`camelJoined` getter: a prefix not ending in `_` is joined camelCase (`resetName`). `methodName`
upcases the attribute and `match` re-cases `$1` through an invented private `attrName` helper.
trails#8422 converged `match` to the one regex test; the re-casing helper is what is left. The
constructor also carries trails-only `!` / `Bang` handling for `proxyTarget` and `parameters`
(`attribute_methods.rb:476-483` has none).

## Acceptance criteria

- [ ] `AttributeMethodPattern` holds Rails' `@regex` / `@method_name` pair. `match` and `methodName`
      are the bodies above, with no `camelJoined` / `attrName` arms.
- [ ] The camelCase spelling of a generated name (`reset_name` → `resetName`) comes from the
      `docs/ruby-ts-conventions.md` translation at the one place a Ruby method name becomes a TS
      property, not from a per-pattern flag.
- [ ] `pnpm parity:api:arms:report --package=activemodel` lists no `AttributeMethodPattern` row.
