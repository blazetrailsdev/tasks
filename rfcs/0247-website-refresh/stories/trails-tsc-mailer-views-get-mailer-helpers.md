---
title: "trails-tsc-mailer-views-get-mailer-helpers"
status: ready
updated: 2026-11-23
rfc: "0247-website-refresh"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/trails-tsc/lib/build-views.ts` `templateScope` types a mailer view's assigns from its mailer class (trails#10654), but `helpersFrom` uses only a controller found by prefix, so a mailer view gets no helper types from its mailer. In Rails a mailer includes `AbstractController::Helpers` (`vendor/rails/v8.0.5.2/actionmailer/lib/action_mailer/base.rb:487`), so `helper` / `helper_method` declared on a mailer reach its views.

## Acceptance criteria

- A mailer view's view type includes its mailer's `_helpers`, as a controller view includes its controller's.
- The existing "mailer views get no controller helpers" test in `packages/trails-tsc/test/build-views.test.ts` still holds: a mailer view does not see `ApplicationController` helpers.
- A test with a mailer that declares a helper, whose view calls it, compiles clean.
