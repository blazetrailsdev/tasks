---
title: "Add Ruby's ancestry-chain step to resolveModuleName's constant lookup"
status: ready
updated: 2026-07-27
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

> Re-homed from RFC 0072 (api-compare parity burndown), which was pruned to
> ActiveRecord-scoped work. This story changes `scripts/api-compare/` tooling,
> not a package, so it belongs with the fidelity-verification tooling.

`resolveModuleName` (`scripts/api-compare/compare.ts:789`) models Ruby constant
lookup as: absolute `::` marker, then nearest enclosing namespace, then the
top-level reading. PR #5354 narrowed its last arm from "return every candidate"
to that top-level fall-through, and made the single-binding contract structural
by returning `string` instead of `string[]`.

Ruby's real lookup has four steps: lexical scope (`Module.nesting`), then the
**ancestry chain** of the innermost cref, then top-level, then `NameError`.
Step two is not implemented. `nearestNamespaceMatch`
(`scripts/api-compare/compare.ts:740`) only splits `contextFqn` on `::` and
walks its own namespace segments outward — it never consults the including
entity's `superclass`, though `ClassInfo.superclass` is available on the
entities both callers already iterate.

So for

```ruby
class Base
  module Foo; end
end
class Sub < Base
  include Foo    # Ruby binds Base::Foo via the ancestry chain
end
```

we walk `Sub`'s segments, find no `Sub::Foo`, and return the verbatim `Foo` —
a top-level name that is typically absent from `rubyPkg.modules`, so
`flattenIncludedMethodInfos` silently skips it and `Base::Foo`'s methods never
join `Sub`'s expected surface. That is a false _negative_ (methods that should
be expected go unexpected), the opposite direction from the false
positive that #5354 and #5344 removed — it under-reports the gap rather than over-crediting
the port, so it is lower-risk but still wrong.

Unmeasured. PR #5354 measured only the ambiguous-fallback arm (26 ambiguous
unqualified include sites across all 13 packages, 0 fall-through firings); it
did not measure how often the verbatim/top-level fall-through returns a name
absent from `rubyPkg.modules` while the context's superclass namespace defines
a matching module.

## Acceptance criteria

- Measure first, as #5354 did: across the real `output/rails-api.json`, count
  include sites where `resolveModuleName` returns a verbatim name that is not a
  known module, _and_ a walk up the `superclass` chain would have found a
  candidate. Report the count and the methods it would move.
- If the count is zero, document the measurement at the call site (the #5354
  disposition for a dead arm) and close — do not add unexercised machinery.
- If non-zero, add the ancestry step between the lexical walk and the top-level
  fall-through, keeping the single-FQN return contract intact.
- Report before/after `pnpm api:compare` totals either way.
