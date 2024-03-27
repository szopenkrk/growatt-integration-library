const PARSERET = require("./parseret");

const MAX = "max";
const MIX = "mix";
const INV = "inv";
const TLX = "tlx";
const TLXH = "tlxh";
const STORAGE = "storage";
const SPA = "spa";
const HPS = "hps";
const SINGLEBACKFLOW = "singleBackflow";
const MULTIPLEBACKFLOW = "multipleBackflow";

export function createInverterConfig(
  type,
  snParam,
  getTotalData,
  getHistory,
  getStatusData,
  readParam,
  writeParam,
  comInverter
) {
  return {
    [type]: {
      snParam,
      getTotalData,
      getHistory,
      getStatusData,
      readParam,
      writeParam,
      comInverter,
    },
  };
}

export function createTimeConfig(type, parseRet) {
  return {
    name: "Time",
    type,
    paramId: "pf_sys_time_mutli",
    parseRet,
    param: { param1: { name: "Time", type: "DATETIME" } },
  };
}

export function createPVActivePowerRateConfig(type, parseRet, def = false) {
  return {
    name: "PV active power rate",
    type,
    paramId: "pv_active_p_rate",
    parseRet,
    param: {
      param1: { name: "Active power rate", type: "INUM_0_100", unit: "%" },
      param2: { name: "Store", type: "BOOL", def },
    },
  };
}

export function createBackflowSettingConfig(parseRet) {
  return {
    name: "Backflow setting",
    type: "backflow_setting",
    paramId: "backflow_setting",
    parseRet,
    param: {
      param1: { name: "Exportlimit on", type: "BOOL" },
      param2: { name: "Exportlimit", type: "INUM_0_100", unit: "%" },
    },
    subRead: ["backflowSettingPower"],
  };
}

export function createBackflowSettingPowerConfig(parseRet, isSubread) {
  return {
    name: "Backflow setting",
    paramId: "backflow_power",
    parseRet,
    isSubread,
  };
}

export function createConfigurations() {
  return {
    ...createInverterConfig(
      MAX,
      "maxSn",
      "/panel/max/getMAXTotalData",
      "/device/getMAXHistory",
      null, // Add getStatusData here if available
      null, // Add readParam here if available
      null, // Add writeParam here if available
      {
        time: createTimeConfig("pf_sys_year", PARSERET.parseRetDate),
        gridFirst: {
          name: "Grid first",
          type: "mix_ac_discharge_time_period",
          paramId: "MIX_AC_DISCHARGE_TIME_MULTI",
          parseRet: PARSERET.parseGritFirst,
          param: {
            param1: {
              name: "Discharge power rate",
              type: "INUM_0_100",
              unit: "%",
            },
            // Add other params here
          },
        },
        batteryFirst: {
          name: "Battery first",
          type: "mix_ac_charge_time_period",
          paramId: "mix_ac_charge_time_multi",
          parseRet: PARSERET.parseBatteryFirst,
          param: {
            param1: {
              name: "Charge power rate",
              type: "INUM_0_100",
              unit: "%",
            },
            // Add other params here
          },
        },
        // Add other comInverter settings here
      }
    ),
    ...createInverterConfig(
      MIX,
      "mixSn",
      "/panel/mix/getMIXTotalData",
      "/device/getMIXHistory",
      "/panel/mix/getMIXStatusData",
      "readMixParam",
      "mixSet",
      {
        time: createTimeConfig("pf_sys_year", PARSERET.parseRetDate),
        pvActivePRate: createPVActivePowerRateConfig(
          "pv_active_p_rate",
          PARSERET.parseRetNum
        ),
        // Add other comInverter settings here
      }
    ),
    // Add other inverter types here
  };
}
