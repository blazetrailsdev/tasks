---
title: "/rfcs sort form uses form_with/select_tag helpers, not hand-written HTML"
status: claimed
updated: 2026-11-18
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 11
pr: null
claim: "2026-11-18T22:21:35Z"
assignee: "view-tests-build-views-in-a-fresh-worktree"
blocked-by: null
closed-reason: null
---

PR trailmap#152 left the /rfcs sort form as hand-written HTML in both apps, and review finding 2 on that PR is still open. trails exports every helper the form needs, in node_modules/@blazetrails/actionview/dist/helpers/form-tag-helper.js and form-options-helper.js: formWith, hiddenFieldTag, labelTag, selectTag and optionsForSelect. So this is no trails gap and needs no DEVIATIONS entry.

Expected shape (Rails): `form_with url: rfcs_path, method: :get, class: "sort-menu"`, then `hidden_field_tag :status, @filter, id: nil`, then `label_tag :sort, "Sort", for: "rfc-sort"`, then `select_tag :sort, options_for_select(@sorts.map { |o| [o.label, o.key, { data: { href: o.href }, title: o.title }] }, @sort), id: "rfc-sort", class: "ctl", data: { sort_menu: true }`. trails: the same calls in camelCase in app/views/rfc-pages/index.html.tse.

Also rename `SortLink` to `SortOption` in rails/app/controllers/rfc_pages_controller.rb:8 (review finding 3). It now renders an option, not a link.

Acceptance:

- Both views use the helpers.
- test/controllers/rfc-list-page.test.ts and rails/test/controllers/rfc_list_page_test.rb are updated to whatever markup the helpers emit (attribute order may change).
- `gate:lists` and `script/tandem` agree on /rfcs.

An unverified draft of the change, never run against the tests:

```diff
diff --git a/app/views/rfc-pages/index.html.tse b/app/views/rfc-pages/index.html.tse
index be2af1d..5940690 100644
--- a/app/views/rfc-pages/index.html.tse
+++ b/app/views/rfc-pages/index.html.tse
@@ -8,16 +8,12 @@

 <div class="list-controls">
   <%= render({ partial: "shared/underline-nav", locals: { tabs: this.tabs } }) %>
-  <form class="sort-menu" method="get" action="<%= rfcsPath() %>">
-    <input type="hidden" name="status" value="<%= this.filter %>">
-    <label for="rfc-sort" class="muted">Sort</label>
-    <select id="rfc-sort" name="sort" class="ctl" data-sort-menu>
-      <% for (const option of this.sorts) { %>
-        <option value="<%= option.key %>" data-href="<%= option.href %>" title="<%= option.title %>"<% if (option.active) { %> selected<% } %>><%= option.label %></option>
-      <% } %>
-    </select>
+  <%= formWith({ url: rfcsPath(), method: "get", class: "sort-menu" }, (f) => { %>
+    <%= hiddenFieldTag("status", this.filter, { id: null }) %>
+    <%= labelTag("sort", "Sort", { for: "rfc-sort", class: "muted" }) %>
+    <%= selectTag("sort", optionsForSelect(this.sorts.map((option) => [option.label, option.key, { data: { href: option.href }, title: option.title }]), this.sort), { id: "rfc-sort", class: "ctl", data: { sortMenu: true } }) %>
     <noscript><button type="submit" class="ctl">Sort</button></noscript>
-  </form>
+  <% }) %>
 </div>

 <div class="box rfc-list">
diff --git a/rails/app/controllers/rfc_pages_controller.rb b/rails/app/controllers/rfc_pages_controller.rb
index d83316b..47e0103 100644
--- a/rails/app/controllers/rfc_pages_controller.rb
+++ b/rails/app/controllers/rfc_pages_controller.rb
@@ -5,7 +5,7 @@ class RfcPagesController < ApplicationController
   STATUS_TABS = %w[active draft postponed closed superseded].freeze

   Tab = Struct.new(:key, :label, :count, :href, :active, keyword_init: true)
-  SortLink = Struct.new(:key, :label, :title, :href, :active, keyword_init: true)
+  SortOption = Struct.new(:key, :label, :title, :href, :active, keyword_init: true)
   Tick = Struct.new(:kind, :pct, :title, keyword_init: true)
   Row = Struct.new(:id, :title, :owner, :priority, :superseded_by, :clusters, :counts, :bar, :bar_length,
                    :stalled, :ticks, :story_total, :open_days, keyword_init: true)
@@ -41,7 +41,7 @@ class RfcPagesController < ApplicationController
       Tab.new(key: s, label: s, count: tab_counts.fetch(s, 0), href: rfcs_path(status: s, **sort_param), active: s == @filter)
     end
     @sorts = RfcProgress::INDEX_SORTS.map do |o|
-      SortLink.new(key: o.key, label: o.label, title: o.title, active: o.key == @sort,
+      SortOption.new(key: o.key, label: o.label, title: o.title, active: o.key == @sort,
                    href: rfcs_path(status: @filter, **(o.key == "priority" ? {} : { sort: o.key })))
     end
     shown = RfcProgress.sort_rfcs_for_index(rfcs.select { |r| r.status == @filter }, @sort, story_counts)
diff --git a/rails/app/views/rfc_pages/index.html.erb b/rails/app/views/rfc_pages/index.html.erb
index ac3d441..9bafbb5 100644
--- a/rails/app/views/rfc_pages/index.html.erb
+++ b/rails/app/views/rfc_pages/index.html.erb
@@ -5,16 +5,12 @@

 <div class="list-controls">
   <%= render "shared/underline_nav", tabs: @tabs %>
-  <form class="sort-menu" method="get" action="<%= rfcs_path %>">
-    <input type="hidden" name="status" value="<%= @filter %>">
-    <label for="rfc-sort" class="muted">Sort</label>
-    <select id="rfc-sort" name="sort" class="ctl" data-sort-menu>
-      <% @sorts.each do |option| %>
-        <option value="<%= option.key %>" data-href="<%= option.href %>" title="<%= option.title %>"<% if option.active %> selected<% end %>><%= option.label %></option>
-      <% end %>
-    </select>
+  <%= form_with url: rfcs_path, method: :get, class: "sort-menu" do %>
+    <%= hidden_field_tag :status, @filter, id: nil %>
+    <%= label_tag :sort, "Sort", for: "rfc-sort", class: "muted" %>
+    <%= select_tag :sort, options_for_select(@sorts.map { |o| [o.label, o.key, { data: { href: o.href }, title: o.title }] }, @sort), id: "rfc-sort", class: "ctl", data: { sort_menu: true } %>
     <noscript><button type="submit" class="ctl">Sort</button></noscript>
-  </form>
+  <% end %>
 </div>

 <div class="box rfc-list">
```
