import { test, expect } from "@playwright/test";

test("POST /api/chat returns the v1 stub reply", async ({ request }) => {
  const res = await request.post("/api/chat", { data: { message: "hello" } });
  expect(res.status()).toBe(200);
  const json = await res.json();
  expect(json.reply).toMatch(/coming soon/i);
});

test("POST /api/chat returns 400 on bad body", async ({ request }) => {
  const res = await request.post("/api/chat", { data: {} });
  expect(res.status()).toBe(400);
  const json = await res.json();
  expect(json.error.code).toBe("BAD_REQUEST");
});

test("GET /api/chat returns 405", async ({ request }) => {
  const res = await request.get("/api/chat");
  expect(res.status()).toBe(405);
});
