/**
 * Runs the real Supabase migration in an in-process Postgres (PGlite) with minimal
 * stand-ins for Supabase's auth/storage schemas, then checks the money-critical logic:
 * credit refills, atomic spending, refunds and row-level security.
 */
import fs from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { beforeAll, describe, expect, it } from "vitest";

const RULES = JSON.stringify({
  free: { refill: 5, every: "1 day" },
  starter: { refill: 300, every: "1 month" },
  pro: { refill: 800, every: "1 month" },
  business: { refill: 2400, every: "1 month" },
});

const SUPABASE_STUBS = `
create role anon nologin; create role authenticated nologin; create role service_role nologin;
create schema auth;
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated;
create schema storage;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
-- Supabase's default grants (RLS then restricts rows).
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;
`;

let db: PGlite;
const alice = "11111111-1111-1111-1111-111111111111";
const bob = "22222222-2222-2222-2222-222222222222";

async function one<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
  return (await db.query<T>(sql, params)).rows[0];
}

beforeAll(async () => {
  db = new PGlite({ extensions: { pgcrypto } });
  await db.exec(SUPABASE_STUBS);
  await db.exec(fs.readFileSync(path.join(__dirname, "../supabase/migrations/0001_init.sql"), "utf8"));
  await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, 'alice@example.com', '{"full_name":"Alice A"}'), ($2, 'bob@example.com', '{}')`, [alice, bob]);
}, 60_000);

describe("profiles", () => {
  it("are created automatically for new auth users", async () => {
    const p = await one<{ email: string; full_name: string; plan: string; referral_code: string }>(`select * from profiles where id = $1`, [alice]);
    expect(p).toMatchObject({ email: "alice@example.com", full_name: "Alice A", plan: "free" });
    expect(p.referral_code).toMatch(/^[0-9a-f]{8}$/);
  });
});

describe("credits", () => {
  it("refill the free daily allowance on first sync, not again the same day", async () => {
    let p = await one<{ credits_allowance: number }>(`select * from sync_credits($1, $2::jsonb)`, [alice, RULES]);
    expect(p.credits_allowance).toBe(5);
    await db.query(`update profiles set credits_allowance = 1 where id = $1`, [alice]);
    p = await one(`select * from sync_credits($1, $2::jsonb)`, [alice, RULES]);
    expect(p.credits_allowance).toBe(1);
  });

  it("spend allowance first, then bonus, and record it in the ledger", async () => {
    await db.query(`select grant_credits($1, 20, null, 'Welcome bonus', null)`, [alice]);
    const spent = await one<{ ledger_id: number; allowance: number; bonus: number }>(`select * from spend_credits($1, 4, $2::jsonb, 'Standard message', 'p1')`, [alice, RULES]);
    expect(spent).toMatchObject({ allowance: 0, bonus: 17 });
    const ledger = await one<{ delta_allowance: number; delta_bonus: number }>(`select * from credit_ledger where id = $1`, [spent.ledger_id]);
    expect(ledger).toMatchObject({ delta_allowance: -1, delta_bonus: -3 });

    // Refund restores both buckets exactly, and only once.
    await db.query(`select refund_credits($1, 'failed')`, [spent.ledger_id]);
    await db.query(`select refund_credits($1, 'failed again')`, [spent.ledger_id]);
    const p = await one<{ credits_allowance: number; credits_bonus: number }>(`select credits_allowance, credits_bonus from profiles where id = $1`, [alice]);
    expect(p).toMatchObject({ credits_allowance: 1, credits_bonus: 20 });
  });

  it("refuse to overspend without changing the balance", async () => {
    await expect(db.query(`select * from spend_credits($1, 500, $2::jsonb, 'Max', null)`, [alice, RULES])).rejects.toThrow(/insufficient_credits/);
    const p = await one<{ credits_allowance: number; credits_bonus: number }>(`select credits_allowance, credits_bonus from profiles where id = $1`, [alice]);
    expect(p.credits_allowance + p.credits_bonus).toBe(21);
  });

  it("use the paid plan's monthly refill when the plan changes", async () => {
    await db.query(`update profiles set plan = 'pro', credits_reset_at = now() - interval '32 days' where id = $1`, [bob]);
    const p = await one<{ credits_allowance: number }>(`select * from sync_credits($1, $2::jsonb)`, [bob, RULES]);
    expect(p.credits_allowance).toBe(800);
    await db.query(`select grant_credits($1, 0, 2400, 'Upgrade', null)`, [bob]);
    const after = await one<{ credits_allowance: number }>(`select credits_allowance from profiles where id = $1`, [bob]);
    expect(after.credits_allowance).toBe(2400);
  });
});

describe("site runtime functions", () => {
  it("rate_limit allows N calls per window", async () => {
    const results: boolean[] = [];
    for (let i = 0; i < 4; i++) results.push((await one<{ ok: boolean }>(`select rate_limit('t:1', 3, 60) as ok`)).ok);
    expect(results).toEqual([true, true, true, false]);
  });

  it("track_page_view aggregates per day, path and source", async () => {
    const { id } = await one<{ id: string }>(`insert into projects (user_id, name, slug) values ($1, 'Site', 'alice-site') returning id`, [alice]);
    await db.query(`select track_page_view($1, '/', 'google.com')`, [id]);
    await db.query(`select track_page_view($1, '/', 'google.com')`, [id]);
    await db.query(`select track_page_view($1, '/about', null)`, [id]);
    const views = (await db.query<{ path: string; views: number }>(`select path, views from page_views where project_id = $1 order by path`, [id])).rows;
    expect(views).toEqual([{ path: "/", views: 2 }, { path: "/about", views: 1 }]);
    const refs = await one<{ views: number }>(`select views from page_referrers where project_id = $1 and source = 'google.com'`, [id]);
    expect(refs.views).toBe(2);
  });

  it("cleanup_ops keeps only the newest versions per project", async () => {
    const { id } = await one<{ id: string }>(`select id from projects where slug = 'alice-site'`);
    for (let i = 0; i < 5; i++) {
      await db.query(`insert into project_versions (project_id, files, label, created_at) values ($1, '{}', $2, now() - make_interval(mins => $3))`, [id, `v${i}`, 10 - i]);
    }
    await db.query(`select cleanup_ops(3)`);
    const labels = (await db.query<{ label: string }>(`select label from project_versions where project_id = $1 order by created_at desc`, [id])).rows.map((r) => r.label);
    expect(labels).toEqual(["v4", "v3", "v2"]);
  });

  it("rejects invalid slugs", async () => {
    await expect(db.query(`insert into projects (user_id, slug) values ($1, '-bad-')`, [alice])).rejects.toThrow();
  });
});

describe("row level security", () => {
  async function asUser<T>(userId: string, fn: () => Promise<T>) {
    await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${userId}', false);`);
    try {
      return await fn();
    } finally {
      await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`);
    }
  }

  it("users only see their own rows", async () => {
    const seen = await asUser(bob, async () => (await db.query<{ id: string }>(`select id from profiles`)).rows.map((r) => r.id));
    expect(seen).toEqual([bob]);
    const projects = await asUser(bob, async () => (await db.query(`select id from projects`)).rows);
    expect(projects).toEqual([]);
  });

  it("users can rename themselves but cannot touch credits, plan or projects", async () => {
    await asUser(bob, () => db.query(`update profiles set full_name = 'Bobby' where id = $1`, [bob]));
    expect((await one<{ full_name: string }>(`select full_name from profiles where id = $1`, [bob])).full_name).toBe("Bobby");

    await expect(asUser(bob, () => db.query(`update profiles set credits_bonus = 99999 where id = $1`, [bob]))).rejects.toThrow(/permission denied/);
    await expect(asUser(bob, () => db.query(`update profiles set plan = 'business' where id = $1`, [bob]))).rejects.toThrow(/permission denied/);
    await expect(asUser(bob, () => db.query(`insert into projects (user_id, slug) values ($1, 'sneaky')`, [bob]))).rejects.toThrow(/permission denied/);
  });

  it("users cannot call privileged credit functions", async () => {
    await expect(asUser(bob, () => db.query(`select grant_credits($1, 1000, null, 'free money', null)`, [bob]))).rejects.toThrow(/permission denied/);
    await expect(asUser(bob, () => db.query(`select * from spend_credits($1, 1, $2::jsonb, 'x', null)`, [alice, RULES]))).rejects.toThrow(/permission denied/);
  });
});
