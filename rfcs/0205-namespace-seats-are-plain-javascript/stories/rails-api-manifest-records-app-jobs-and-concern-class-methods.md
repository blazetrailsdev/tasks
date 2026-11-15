---
title: "rails-api-manifest-records-app-jobs-and-concern-class-methods"
status: done
updated: 2026-11-15
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10117
claim: "2026-11-15T00:13:48Z"
assignee: "activerecord-file-local-cycles-blocking-namespace-read-imports"
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/class-paths.ts --check` reports a walked TS export as having no Ruby counterpart when `scripts/api-compare/output/rails-api.json` lacks the Ruby constant. Two kinds of Ruby constant are missing from the manifest:

- `SolidCache::ExpiryJob` (`vendor/solid_cache/v1.0.7/app/jobs/solid_cache/expiry_job.rb:4`). The manifest records solid_cache's `app/models`, but not its `app/jobs`.
- The `ClassMethods` module that `ActiveSupport::Concern#class_methods` defines (`vendor/rails/v8.0.2/activesupport/lib/active_support/concern.rb`). This affects `SolidCache::Entry::Expiration` (`app/models/solid_cache/entry/expiration.rb`) and `SolidCache::Entry::Size`. solid-queue's `job/clearable.ts::ClassMethods` and ten other `ClassMethods` entries sit in `constant-residue.json`'s `excluded` list for the same reason.

trails#10089 receipts `entry/expiration.ts::ClassMethods`, `entry/size.ts::ClassMethods` and `expiry-job.ts::ExpiryJob` as `@noRailsEquivalent CONVERGEABLE` against this story.

## Acceptance criteria

- The Ruby API extractor records the classes in a gem's `app/jobs`, and the `ClassMethods` module that a `class_methods do` block defines.
- Those exports pair with their Ruby constants. Each `excluded` row in `constant-residue.json` that this covers is removed, and so are the CONVERGEABLE receipts that point at this story.
