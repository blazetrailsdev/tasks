---
title: "actionview-tests-needing-actionpack-controller-and-parameters"
status: done
updated: 2026-10-19
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9105
claim: "2026-10-19T23:26:43Z"
assignee: "actionview-tests-needing-actionpack-controller-and-parameters"
blocked-by: null
closed-reason: null
---

## Context

Three ported tests stay parked as `it.skip` because their Rails setup reaches actionpack, which actionview does not depend on:

- `test_file_field_tag_with_direct_upload_when_rails_direct_uploads_url_is_defined` (`vendor/rails/v8.0.2/actionview/test/template/form_tag_helper_test.rb:351`) and `test_file_field_with_direct_upload_when_rails_direct_uploads_url_is_defined` (`vendor/rails/v8.0.2/actionview/test/template/form_helper_test.rb:597`) both set `@controller = WithActiveStorageRoutesControllers.new` (`form_tag_helper_test.rb:10-18`), an `ActionController::Base` whose routes define `rails_direct_uploads`.
- `test_text_field_tag_with_ac_parameters` (`form_tag_helper_test.rb:564`) needs `ActionController::Parameters`.

Trails: `packages/actionview/src/template/form-tag-helper.test.ts` and `packages/actionview/src/template/form-helper.test.ts`, each under `// BLOCKED: actionview-tests-needing-actionpack-controller-and-parameters`. `form-helper.test.ts` already imports `RouteSet` from `@blazetrails/actionpack` as a dev dependency, so an actionview-side test controller with ActiveStorage-shaped routes may be buildable.

## Acceptance criteria

- [ ] The three tests run at their Rails names with Rails' assertions, via an actionview-side test controller / `ActionController::Parameters` from the actionpack dev dependency.
- [ ] Their `BLOCKED:` lines are removed.
