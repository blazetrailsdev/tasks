---
title: "Test extractors: Object.keys().join titles, each_with_index mlhs, cross-file constant receivers"
status: done
updated: 2026-09-26
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trails#8153
claim: "2026-09-26T17:22:02Z"
assignee: "port-resolver-caching-and-cache-template-loading"
blocked-by: null
closed-reason: null
---

## Context

After #8127, three loop shapes still keep Rails tests from being written or
matched as loops:

1. **TS title evaluator** (`scripts/test-compare/extract-ts-core.ts#evalBoundExpression`)
   binds strings only. So the port of `"test_recognize_#{expected.keys.map(&:to_s).join('_')}"`
   (`vendor/rails/actionpack/test/journey/router_test.rb:317-336`) cannot title
   an `Object.entries` loop with `` `recognize ${Object.keys(expected).join("_")}` ``.
   #8127 therefore wrote the three "recognize controller…" tests out one by one
   in `packages/actionpack/src/action-dispatch/journey/router.test.ts`, where
   Rails has one loop. Bind object-literal values and evaluate
   `Object.keys(x).join(<literal>)`, then fold the three tests back into the
   Rails-shaped loop.
2. **Ruby `each_with_index` with `|(url, params), i|`**
   (`vendor/rails/actionpack/test/controller/url_for_integration_test.rb:77-193`):
   `process_define_method_loop` binds the element and index positionally and
   does not destructure the nested `mlhs`. The two `define_method`s sit on the
   two arms of `if params.length > 1`, so they must be expanded per element
   under that arm, not both for every element.
3. **Cross-file constant receiver** `MixtureToTitleCase.each_with_index`
   (`vendor/rails/activesupport/test/inflector_test.rb:123`, constant defined in
   `inflector_test_cases.rb` and mixed in by `include InflectorTestCases`):
   `collect_const_arrays` reads only the current file.

## Acceptance criteria

- `router.test.ts`' recognize-controller family is one `for … of Object.entries({...})`
  loop and still matches three Rails tests.
- `url_for_integration_test.rb:77` and `inflector_test.rb:123` no longer appear
  in `define_method loops not statically expandable`. Runtime receivers
  (`Encoding.list`, `TimeZone::MAPPING`, `ERB::Util::HTML_ESCAPE`) still report.
- All-package before/after in the PR body shows no package's `extra` count rising.
