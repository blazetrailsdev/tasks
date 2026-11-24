---
title: "Preview URL https check agrees between trails and Rails apps"
status: in-progress
updated: 2026-11-24
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trailmap#199
claim: "2026-11-24T21:08:04Z"
assignee: "preview-url-https-check-parity"
blocked-by: null
closed-reason: null
---

Surfaced on trailmap#160. `deployPreviewUrl` (app/helpers/deploys-helper.ts:20) and `deploy_preview_url` (rails/app/helpers/deploys_helper.rb:16) disagree. WHATWG `new URL` accepts `"https:host"` and strips whitespace around `" https://x "`, but Ruby's `URI.parse` gives a nil host for the first input and raises on the second.

Expected: both return nil for these inputs. On the TS side, require `url.startsWith("https://")`, no surrounding whitespace, and a non-empty host. Add both inputs to both helper tests.
