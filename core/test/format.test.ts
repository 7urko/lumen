import { test } from "node:test";
import assert from "node:assert/strict";
import {
  fmtUsd,
  fmtUsd0,
  fmtSigned,
  fmtAmt,
  shortAddr,
  relTime,
  initials,
  escapeHtml,
  daysAgo,
} from "../src/format";

test("fmtUsd formats with thousands + 2dp", () => {
  assert.equal(fmtUsd(1234.5), "$1,234.50");
  assert.equal(fmtUsd(0), "$0.00");
});

test("fmtUsd pads to 2dp but allows more precision for sub-dollar values", () => {
  assert.equal(fmtUsd(0.5), "$0.50"); // min 2dp, no padding beyond
  assert.equal(fmtUsd(0.1234567), "$0.1235"); // <$1 → up to 4dp (rounded)
  assert.equal(fmtUsd(0.001234), "$0.001234"); // <$0.01 → up to 6dp
});

test("fmtUsd0 rounds to whole dollars", () => {
  assert.equal(fmtUsd0(1234.49), "$1,234");
  assert.equal(fmtUsd0(1234.5), "$1,235");
});

test("fmtSigned prefixes + / − (true minus)", () => {
  assert.equal(fmtSigned(10), "+$10.00");
  assert.equal(fmtSigned(-5), "−$5.00");
  assert.equal(fmtSigned(0), "+$0.00");
});

test("fmtAmt trims trailing zeros, keeps significant decimals", () => {
  assert.equal(fmtAmt(1.5), "1.5");
  assert.equal(fmtAmt(0), "0");
  assert.equal(fmtAmt(3.927), "3.927");
  assert.equal(fmtAmt(100), "100");
});

test("shortAddr truncates long, passes through short", () => {
  assert.equal(shortAddr("0x4a8f23bd9c1e77a6f0b2d4513e8c9a2f17b6d340"), "0x4a8f23…b6d340");
  assert.equal(shortAddr("short"), "short");
  assert.equal(shortAddr(""), "");
});

test("relTime buckets by recency (fixed now)", () => {
  const now = 1_000_000_000_000;
  assert.equal(relTime(now - 30_000, now), "just now");
  assert.equal(relTime(now - 5 * 60_000, now), "5m ago");
  assert.equal(relTime(now - 3 * 3_600_000, now), "3h ago");
  assert.equal(relTime(now - 4 * 86_400_000, now), "4d ago");
});

test("initials returns up to two letters", () => {
  assert.equal(initials("Alice Nguyen"), "AN");
  assert.equal(initials("Madonna"), "M");
  assert.equal(initials("  spaced   out  "), "so");
});

test("escapeHtml escapes the significant characters", () => {
  assert.equal(escapeHtml('<b>"Tom & Jerry"</b>'), "&lt;b&gt;&quot;Tom &amp; Jerry&quot;&lt;/b&gt;");
});

test("daysAgo subtracts whole days from a fixed now", () => {
  const now = 1_000_000_000_000;
  assert.equal(daysAgo(1, now), now - 86_400_000);
  assert.equal(daysAgo(0, now), now);
});
