import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveRecipient, assessRisk, isFlagged, LARGE_TRANSFER_USD } from "../src/scam-shield";
import { DEMO_DIRECTORY, DRAINER_ADDR } from "../src/demo-data";

const dir = DEMO_DIRECTORY;

test("resolveRecipient: blank input", () => {
  const r = resolveRecipient("", dir);
  assert.equal(r.ok, false);
  assert.equal(r.empty, true);
});

test("resolveRecipient: a saved contact wins over the registry", () => {
  const r = resolveRecipient("alice.lumen", dir);
  assert.equal(r.ok, true);
  assert.equal(r.kind, "contact");
  assert.equal(r.address, dir.registry["alice.lumen"]);
  assert.equal(r.flagReasons, null);
});

test("resolveRecipient: a registered-but-uncontacted username", () => {
  const r = resolveRecipient("satoshi.lumen", dir);
  assert.equal(r.ok, true);
  assert.equal(r.kind, "username");
  assert.equal(r.address, dir.registry["satoshi.lumen"]);
});

test("resolveRecipient: a raw 0x address (not a known contact)", () => {
  const addr = "0xabcdef0123456789abcdef0123456789abcdef01";
  const r = resolveRecipient(addr, dir);
  assert.equal(r.ok, true);
  assert.equal(r.kind, "address");
  assert.equal(r.address, addr);
});

test("resolveRecipient: an address belonging to a contact resolves as that contact", () => {
  const r = resolveRecipient(dir.contacts[0]!.address, dir);
  assert.equal(r.kind, "contact");
});

test("resolveRecipient: a *.lumen name that is not registered", () => {
  const r = resolveRecipient("nobody.lumen", dir);
  assert.equal(r.ok, false);
  assert.equal(r.unknownName, true);
});

test("resolveRecipient: gibberish is invalid", () => {
  const r = resolveRecipient("hello world", dir);
  assert.equal(r.ok, false);
  assert.equal(r.invalid, true);
});

test("resolveRecipient: a scam handle carries the drainer flag reasons", () => {
  const r = resolveRecipient("claim-airdrop.lumen", dir);
  assert.equal(r.ok, true);
  assert.equal(r.address, DRAINER_ADDR);
  assert.ok(Array.isArray(r.flagReasons) && r.flagReasons.length > 0);
});

test("isFlagged: known drainer flagged, clean address not", () => {
  assert.ok(isFlagged(DRAINER_ADDR, dir.blocklist));
  assert.equal(isFlagged(dir.registry["alice.lumen"], dir.blocklist), null);
  assert.equal(isFlagged("", dir.blocklist), null);
});

test("isFlagged is case-insensitive on the address", () => {
  assert.ok(isFlagged(DRAINER_ADDR.toUpperCase(), dir.blocklist));
});

test("assessRisk: flagged recipient is danger", () => {
  const v = assessRisk(resolveRecipient("claim-airdrop.lumen", dir), 100);
  assert.equal(v.level, "danger");
  assert.ok(v.reasons.every((r) => r.kind === "bad"));
});

test("assessRisk: a normal small send is safe", () => {
  const v = assessRisk(resolveRecipient("satoshi.lumen", dir), 100);
  assert.equal(v.level, "safe");
});

test("assessRisk: a large send is caution", () => {
  const v = assessRisk(resolveRecipient("satoshi.lumen", dir), LARGE_TRANSFER_USD + 1);
  assert.equal(v.level, "caution");
  assert.ok(v.reasons.some((r) => r.kind === "warn"));
});

test("assessRisk: a trusted contact is noted as previously trusted", () => {
  const v = assessRisk(resolveRecipient("alice.lumen", dir), 100);
  assert.equal(v.level, "safe");
  assert.ok(v.reasons.some((r) => /trusted this address before/.test(r.text)));
});
