import assert from "node:assert/strict";
import { test } from "node:test";
import {
  gpaOnTenScale,
  isProfileComplete,
  matchSchools,
} from "../lib/school-match.ts";

// Bộ điểm chuẩn đúng như dữ liệu trong database.
const schools = [
  { id: "auckland", name: "Đại học Auckland", country: "New Zealand", minGpa: 7.5, minIelts: 6.5 },
  { id: "deakin", name: "Đại học Deakin", country: "Úc", minGpa: 7.0, minIelts: 6.0 },
  { id: "melbourne", name: "Đại học Melbourne", country: "Úc", minGpa: 8.5, minIelts: 7.0 },
  { id: "swinburne", name: "Đại học Swinburne", country: "Úc", minGpa: 7.0, minIelts: 6.0 },
];

const verdicts = (gpa: number | null, gpaScale: number | null, ielts: number | null) =>
  Object.fromEntries(
    matchSchools(schools, { gpa, gpaScale, ielts }).map((r) => [r.school.id, r.verdict]),
  );

test("GPA 8.2/10 và IELTS 6.5: đạt 3 trường, chưa đạt Melbourne", () => {
  assert.deepEqual(verdicts(8.2, 10, 6.5), {
    auckland: "dat",
    deakin: "dat",
    melbourne: "chua_dat",
    swinburne: "dat",
  });
});

test("bằng đúng điểm chuẩn thì đạt, thấp hơn 0.1 thì chưa đạt", () => {
  assert.equal(verdicts(7.5, 10, 6.5).auckland, "dat");
  assert.equal(verdicts(7.4, 10, 6.5).auckland, "chua_dat");
  assert.equal(verdicts(7.5, 10, 6.4).auckland, "chua_dat");
});

test("chỉ cần một tiêu chí không đạt là chưa đạt", () => {
  assert.equal(verdicts(9.5, 10, 5.5).melbourne, "chua_dat"); // GPA cao nhưng IELTS thấp
  assert.equal(verdicts(6.0, 10, 8.0).deakin, "chua_dat"); // IELTS cao nhưng GPA thấp
});

test("quy điểm thang 4 và thang 100 về thang 10", () => {
  assert.equal(gpaOnTenScale(3.5, 4), 8.75);
  assert.equal(gpaOnTenScale(82, 100), 8.2);
  assert.equal(gpaOnTenScale(8.2, 10), 8.2);
  assert.equal(verdicts(3.5, 4, 7.0).melbourne, "dat"); // 8.75 >= 8.5
  assert.equal(verdicts(3.2, 4, 7.0).melbourne, "chua_dat"); // 8.0 < 8.5
});

test("không ghi thang điểm: >10 coi là thang 100, <=4.5 mơ hồ nên không so", () => {
  assert.equal(gpaOnTenScale(82, null), 8.2);
  assert.equal(gpaOnTenScale(3.2, null), null);
  assert.equal(gpaOnTenScale(8.2, null), 8.2);
  assert.equal(verdicts(3.2, null, 6.5).deakin, "thieu");
});

test("thiếu điểm thì chưa đủ dữ liệu, trừ khi tiêu chí còn lại đã không đạt", () => {
  assert.equal(verdicts(null, null, 7.0).deakin, "thieu");
  assert.equal(verdicts(8.0, 10, null).deakin, "thieu");
  assert.equal(verdicts(null, null, 5.0).deakin, "chua_dat");
});

test("chỉ coi hồ sơ đầy đủ khi cả 3 giấy tờ hợp lệ", () => {
  const ok = { status: "hop_le" };
  const bad = { status: "can_nop_lai" };
  assert.equal(isProfileComplete({ transcript: ok, ielts: ok, identity: ok }), true);
  assert.equal(isProfileComplete({ transcript: ok, ielts: ok, identity: bad }), false);
  assert.equal(isProfileComplete({ transcript: ok, ielts: null, identity: ok }), false);
});
