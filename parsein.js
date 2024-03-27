const debugApi = require("debug")("growatt:api");

export function INUM_0_100(val) {
  debugApi("INUM_0_100:", val);
  return [val, Number.isInteger(val) && val >= 0 && val <= 100];
}

export function INUM_0_24(val) {
  debugApi("INUM_0_24:", val);
  return [val, Number.isInteger(val) && val >= 0 && val <= 24];
}

export function INUM_0_60(val) {
  debugApi("INUM_0_60:", val);
  return [val, Number.isInteger(val) && val >= 0 && val <= 60];
}

export function INUM_0_1(val) {
  debugApi("INUM_0_1:", val);
  return [val, Number.isInteger(val) && val >= 0 && val <= 1];
}

export function BOOL(val) {
  debugApi("BOOL:", val);
  return [val === true ? 1 : 0, val === false || val === true];
}

export function STIME_H_MIN(val) {
  debugApi("STIME_H_MIN:", val);
  return [val, /^(2[0-3]|[01][0-9]):([0-5][0-9])$/.test(val)];
}

export function DATETIME(val) {
  debugApi("DATETIME:", val);
  try {
    const d = new Date(val);
    const year = `000${d.getFullYear()}`.slice(-4);
    const month = `0${d.getMonth() + 1}`.slice(-2);
    const day = `0${d.getDate()}`.slice(-2);
    const hour = `0${d.getHours()}`.slice(-2);
    const minute = `0${d.getMinutes()}`.slice(-2);
    const secunde = `0${d.getSeconds()}`.slice(-2);
    const res = `${year}-${month}-${day} ${hour}:${minute}:${secunde}`;
    return [
      res,
      /^[0-9][0-9][0-9][0-9]-(1[0-2]|0[1-9])-(3[0-1]|[0-2][0-9]) (2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])$/.test(
        res
      ),
    ];
  } catch (Error) {
    return [0, false];
  }
}
