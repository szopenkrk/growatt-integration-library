const debugApi = require("debug")("growatt:api");

export function fTime(val, ok) {
  debugApi("fTime:", "val", val, "ok", ok);
  const H = val >> 8;
  const M = val & 255;

  return [
    `${`00${H}`.slice(-2)}:${`00${M}`.slice(-2)}`,
    ok && H >= 0 && H <= 23 && M >= 0 && M <= 59,
  ];
}

export function fBool(val, ok) {
  debugApi("fBool:", "val", val, "ok", ok);
  return [val === 1, ok && val >= 0 && val <= 1];
}

export function fNum(val, min, max, ok) {
  debugApi("fNum:", "val", val, "min", min, "max", max, "ok", ok);
  const r = parseInt(val, 10);
  return [r, ok && r >= min && r <= max];
}

export function fDate(val, ok) {
  debugApi("fDate:", "val", val, "ok", ok);
  const ar = val
    .toString()
    .split("-")
    .map((n) => parseInt(n, 10));
  try {
    return [
      new Date(ar[0], ar[1] - 1, ar[2], ar[3], ar[4], ar[5]).getTime(),
      ok,
    ];
  } catch (error) {
    return [0, false];
  }
}

export function parseRetDate(val, resolve) {
  debugApi("parseRetDate:", val);
  if (val.success === true && val.msg) {
    [val.param1, val.success] = fDate(val.msg, val.success);
  } else {
    val.success = false;
  }
  debugApi("parseRetDate result:", val);
  resolve(val);
}

export function parseBatteryFirst(val, resolve) {
  debugApi("parseBatteryFirst:", val);
  if (val.success === true && val.msg) {
    const ar = val.msg
      .toString()
      .split("-")
      .map((n) => parseInt(n, 10));
    if (ar.length > 18) {
      let time = "";
      [val.param1, val.success] = fNum(ar[0], 0, 100, val.success);
      [val.param2, val.success] = fNum(ar[1], 0, 100, val.success);
      [val.param3, val.success] = fBool(ar[2], val.success);
      [time, val.success] = fTime(ar[10], val.success);
      [val.param4, val.success] = fNum(
        time.substring(0, 2),
        0,
        24,
        val.success
      );
      [val.param5, val.success] = fNum(
        time.substring(3, 6),
        0,
        60,
        val.success
      );
      [time, val.success] = fTime(ar[11], val.success);
      [val.param6, val.success] = fNum(
        time.substring(0, 2),
        0,
        24,
        val.success
      );
      [val.param7, val.success] = fNum(
        time.substring(3, 6),
        0,
        60,
        val.success
      );
      [val.param8, val.success] = fBool(ar[12], val.success);
      [time, val.success] = fTime(ar[13], val.success);
      [val.param9, val.success] = fNum(
        time.substring(0, 2),
        0,
        24,
        val.success
      );
      [val.param10, val.success] = fNum(
        time.substring(3, 6),
        0,
        60,
        val.success
      );
      [time, val.success] = fTime(ar[14], val.success);
      [val.param11, val.success] = fNum(
        time.substring(0, 2),
        0,
        24,
        val.success
      );
      [val.param12, val.success] = fNum(
        time.substring(3, 6),
        0,
        60,
        val.success
      );
      [val.param13, val.success] = fBool(ar[15], val.success);
      [time, val.success] = fTime(ar[16], val.success);
      [val.param14, val.success] = fNum(
        time.substring(0, 2),
        0,
        24,
        val.success
      );
      [val.param15, val.success] = fNum(
        time.substring(3, 6),
        0,
        60,
        val.success
      );
      [time, val.success] = fTime(ar[17], val.success);
      [val.param16, val.success] = fNum(
        time.substring(0, 2),
        0,
        24,
        val.success
      );
      [val.param17, val.success] = fNum(
        time.substring(3, 6),
        0,
        60,
        val.success
      );
      [val.param18, val.success] = fBool(ar[18], val.success);
    } else {
      val.success = false;
    }
  } else {
    val.success = false;
  }
  debugApi("parseBatteryFirst result:", val);
  resolve(val);
}

export function parseGritFirst(val, resolve) {
  debugApi("parseGritFirst:", val);
  if (val.success === true && val.msg) {
    const ar = val.msg
      .toString()
      .split("-")
      .map((n) => parseInt(n, 10));
    if (ar.length > 18) {
      let time = "";
      [val.param1, val.success] = fNum(ar[0], 0, 100, val.success);
      [val.param2, val.success] = fNum(ar[1], 0, 100, val.success);
      [time, val.success] = fTime(ar[10], val.success);
      [val.param3, val.success] = fNum(
        time.substring(0, 2),
        0,
        24,
        val.success
      );
      [val.param4, val.success] = fNum(
        time.substring(3, 6),
        0,
        60,
        val.success
      );
      [time, val.success] = fTime(ar[11], val.success);
      [val.param5, val.success] = fNum(
        time.substring(0, 2),
        0,
        24,
        val.success
      );
      [val.param6, val.success] = fNum(
        time.substring(3, 6),
        0,
        60,
        val.success
      );
      [val.param7, val.success] = fBool(ar[12], val.success);
      [time, val.success] = fTime(ar[13], val.success);
      [val.param8, val.success] = fNum(
        time.substring(0, 2),
        0,
        24,
        val.success
      );
      [val.param9, val.success] = fNum(
        time.substring(3, 6),
        0,
        60,
        val.success
      );
      [time, val.success] = fTime(ar[14], val.success);
      [val.param10, val.success] = fNum(
        time.substring(0, 2),
        0,
        24,
        val.success
      );
      [val.param11, val.success] = fNum(
        time.substring(3, 6),
        0,
        60,
        val.success
      );
      [val.param12, val.success] = fBool(ar[15], val.success);
      [time, val.success] = fTime(ar[16], val.success);
      [val.param13, val.success] = fNum(
        time.substring(0, 2),
        0,
        24,
        val.success
      );
      [val.param14, val.success] = fNum(
        time.substring(3, 6),
        0,
        60,
        val.success
      );
      [time, val.success] = fTime(ar[17], val.success);
      [val.param15, val.success] = fNum(
        time.substring(0, 2),
        0,
        24,
        val.success
      );
      [val.param16, val.success] = fNum(
        time.substring(3, 6),
        0,
        60,
        val.success
      );
      [val.param17, val.success] = fBool(ar[18], val.success);
    } else {
      val.success = false;
    }
  } else {
    val.success = false;
  }
  debugApi("parseGritFirst result:", val);
  resolve(val);
}

export function parseRetNum(val, resolve) {
  debugApi("parseRetNum:", val);
  if (val.success === true && val.msg) {
    [val.param1, val.success] = fNum(
      parseInt(val.msg.toString(), 10),
      0,
      100,
      val.success
    );
  } else {
    val.success = false;
  }
  debugApi("parseRetNum result:", val);
  resolve(val);
}

export function parseRetNum2div10(val, resolve) {
  debugApi("parseRetNum:", val);
  if (val.success === true && val.msg) {
    [val.param2, val.success] = fNum(
      parseInt(val.msg.toString(), 10) / 10,
      0,
      100,
      val.success
    );
  } else {
    val.success = false;
  }
  debugApi("parseRetNum result:", val);
  resolve(val);
}

export function parseRetBool(val, resolve) {
  debugApi("parseRetBool:", val);
  if (val.success === true && val.msg) {
    [val.param1, val.success] = fBool(
      parseInt(val.msg.toString(), 10),
      val.success
    );
  } else {
    val.success = false;
  }
  debugApi("parseRetBool result:", val);
  resolve(val);
}

export function parseRetBoot(val, resolve) {
  debugApi("parseRetBoot:", val);
  if (val.success === true && val.msg) {
    [val.param1, val.success] = fNum(
      parseInt(val.msg.toString(), 10),
      0,
      1,
      val.success
    );
  } else {
    val.success = false;
  }
  debugApi("parseRetBoot result:", val);
  resolve(val);
}
