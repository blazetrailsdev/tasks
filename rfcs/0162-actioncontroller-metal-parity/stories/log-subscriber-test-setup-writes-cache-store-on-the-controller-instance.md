---
title: "log_subscriber_test setup writes cache_store and perform_caching on the controller instance"
status: in-progress
updated: 2026-10-10
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8757
claim: "2026-10-10T15:29:04Z"
assignee: "update-columns-reassigns-attributes-and-passes-it-to-update-record"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8645. Rails' `ACLogSubscriberTest#setup`
(`vendor/rails/v8.0.2/actionpack/test/controller/log_subscriber_test.rb:114-115`) does

    @controller.cache_store = :file_store, @cache_path
    @controller.config.perform_caching = true

on the controller INSTANCE. trails' `setup`
(`packages/actionpack/src/action-controller/controller/log-subscriber.test.ts`)
assigns `cacheStore` and `performCaching` on the `LogSubscribersController`
CLASS through a `CachingClassMethods` cast, so the setting leaks to every later
instance and no instance writer is exercised.

## Acceptance criteria

- `setup` writes `this.controller.cacheStore = [":file_store", this.cachePath]`
  and `this.controller.config.performCaching = true`, with no class cast.
- If the instance writers are missing, they are ported at their Rails names
  (`abstract_controller/caching.rb`, `config_accessor` / `cache_store=`), not worked around in the test.
