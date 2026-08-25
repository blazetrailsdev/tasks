import { Migration } from "@blazetrails/activerecord";

export default class CreateStories extends Migration {
  async change() {
    // Story slug is the natural key: what agents type, what PR bodies cite, and
    // what the spawn loop passes around.
    await this.createTable("stories", { id: "string" }, (t) => {
      t.string("rfc_id", { null: false });
      t.string("title");
      t.string("cluster");
      t.integer("priority");
      t.integer("est_loc");
      t.string("file_path");

      // ── DB-owned state. Never written by ingest. ──
      t.string("status", { null: false, default: "draft" });
      t.integer("pr");
      t.string("assignee");
      t.string("blocked_by");
      t.text("closed_reason");
      t.datetime("claim_at");

      t.timestamps();

      // The claim predicate is `WHERE id = ? AND status = ?`; the ready-queue
      // scan filters on status, then groups by rfc_id.
      t.index(["status"]);
      t.index(["rfc_id", "status"]);
    });
  }
}
