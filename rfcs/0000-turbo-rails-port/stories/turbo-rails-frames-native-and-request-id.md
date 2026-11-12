---
title: "Port Turbo::Frames::FrameRequest, the frame layout, Native::Navigation and RequestIdTracking"
status: draft
updated: 2026-11-12
rfc: "0000-turbo-rails-port"
cluster: turbo-rails
packages: [turbo-rails]
deps: [turbo-rails-package-helpers-and-turbo-stream-format]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

- `vendor/turbo-rails/v2.0.23/app/controllers/turbo/frames/frame_request.rb:20-38` covers the
  `layout` lambda that answers `"turbo_rails/frame"` for a frame request,
  `turbo_frame_request?` (`:31`) and `turbo_frame_request_id` (`:35`). The
  layout is `vendor/turbo-rails/v2.0.23/app/views/layouts/turbo_rails/frame.html.erb:1-9`, ported to
  TSE.
- `app/controllers/turbo/native/navigation.rb:6-65` and
  `navigation_controller.rb:1-13`.
- `app/controllers/concerns/turbo/request_id_tracking.rb:1-12`.
- Tests: `vendor/turbo-rails/v2.0.23/test/frames/frame_request_controller_test.rb` (10),
  `native/navigation_controller_test.rb` (4),
  `refreshes/request_id_tracking_test.rb` and `current_request_id_test.rb`.

## Acceptance criteria

- Each class or module is included through the `turbo.helpers` /
  `turbo.request_id_tracking` initializers' `on_load` hooks, as in
  `engine.rb:55-66`.
- The listed tests are ported under their upstream names.
