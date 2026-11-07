---
title: "trails: date, html-sanitizer, image-processing, nokogiri and tzinfo have no Rails counterpart in the package summary"
status: done
updated: 2026-11-07
rfc: "0136-trailmap"
cluster: null
packages: ["scripts", "date", "html-sanitizer", "image-processing", "nokogiri", "tzinfo"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#9825
claim: "2026-11-07T04:46:56Z"
assignee: "api-compare-gem-ports-without-api-rows"
blocked-by: null
closed-reason: null
---

## Context

`package-summary.ts` (`railsCounterpartOf`) takes a package's counterpart from api:compare's `SOURCES`. `date`, `html-sanitizer`, `image-processing`, `nokogiri` and `tzinfo` are ports of Ruby gems (`date`, `rails-html-sanitizer`, `image_processing`, `nokogiri`, `tzinfo`), but none is in `SOURCES`. So `package_meta.rails_counterpart` is NULL, `package_file_stats` has no rows, and `/packages/<name>` shows no files, API or tests. Only `date` has test:compare rows.

## Acceptance criteria

- Each of the five is enrolled in api:compare's `SOURCES` against its gem, or excluded with a recorded reason. Enrolled packages get a counterpart, file stats and api rows on the next synced commit.
- A trails test lists every `packages/*` directory without a counterpart, and the expected list is exactly the trails-only packages (see `packages-page-names-trails-only-packages`).
