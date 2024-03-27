import axios from "axios";

const Url = require("url");
const https = require("https");
const debugApi = require("debug")("growatt:api");
const debugVerbose = require("debug")("growatt:verbose");
const QUEUE = require("./queue");
const GROWATTTYPE = require("./growatttype");
const PARSEIN = require("./parsein");

const server = "https://server.growatt.com";
const index = "index";
const indexbC = "indexbC";
const timeout = 50000;
const headers = {};

export const LOGGERREGISTER = {
  INTERVAL: 4,
  SERVERIP: 17,
  SERVERPORT: 18,
};
export const LOGGERFUNCTION = {
  REGISTER: 0,
  SERVERIP: 1,
  SERVERNAME: 2,
  SERVERPORT: 3,
};

const getJSONCircularReplacer = () => {
  const seen = new WeakMap();
  return (key, val) => {
    const value = val;
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return `loop on ${seen.get(value)}`;
      }
      seen.set(value, key);
    }
    return value;
  };
};

const growatt = (conf) => {
  const config = conf || {};
  let lifeSignCallback;
  debugApi("constructor in config:", config);

  if (typeof config.timeout === "undefined") config.timeout = timeout;
  if (typeof config.headers === "undefined") config.headers = headers;
  if (typeof config.server === "undefined" || config.server === "")
    config.server = server;
  if (typeof config.indexCandI === "undefined") config.indexCandI = false;

  const queue = new QUEUE();
  let connected = false;
  let cookie = "";
  const httpsAgent = new https.Agent({ rejectUnauthorized: false });

  const instance = axios.create({
    baseURL: server,
    timeout: timeout,
    headers: headers,
    httpsAgent,
  });

  if (typeof config.lifeSignCallback !== "undefined") {
    lifeSignCallback = config.lifeSignCallback;
  }

  debugApi("constructor config:", config);

  const getUrl = (path) => {
    return config.server + path;
  };

  const getIndex = () => {
    return config.indexCandI ? indexbC : index;
  };

  const isConnected = () => {
    return connected;
  };

  const extractSession = () => {
    let session = "";
    if (cookie) {
      const lines = cookie.split(";");
      lines.forEach((val) => {
        if (val.startsWith("JSESSIONID")) {
          [, session] = val.split("=");
        }
      });
    }
    return session;
  };

  const makeCallHeader = (login) => {
    const head = {
      Accept: "application/json, text/plain, */*",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
    };
    if (login) {
      //
    } else {
      head.cookie = cookie;
      head.Referer = `${
        config.server
      }/${getIndex()};jsessionid=${extractSession()}`;
    }
    return head;
  };

  const login = (user, password) => {
    return new Promise((resolve, reject) => {
      const params = {
        account: user,
        password: password,
        validateCode: "",
      };
      connected = false;
      if (lifeSignCallback) lifeSignCallback();
      instance
        .post(getUrl("/login"), params.toString(), {
          headers: makeCallHeader(true),
        })
        .then((res) => {
          debugVerbose("login result:", res);
          if (res.data && res.data.result && res.data.result === 1) {
            cookie = res.headers["set-cookie"].toString();
            connected = true;
            console.log("Loged in", res.data);
            debugApi("login resolve:", res.data);
            resolve(res.data);
          } else if (res.data && res.data.result) {
            console.log("login reject:", res.data, res.data.result);
            reject(
              new Error(JSON.stringify(res.data, getJSONCircularReplacer()))
            );
          } else {
            debugApi("login reject");
            if (res.request.path.match("errorMess")) {
              reject(
                new Error(
                  `The server sent an unexpected response: ${res.request.path}`
                )
              );
            } else {
              reject(
                new Error(
                  "The server sent an unexpected response, a fatal error has occurred"
                )
              );
            }
          }
        })
        .catch((e) => {
          debugApi(
            "login err:",
            JSON.stringify(e, getJSONCircularReplacer(), "  ")
          );
          reject(e);
        });
    });
  };

  const demoLogin = () => {
    return new Promise((resolve, reject) => {
      debugApi("demoLogin:");
      connected = false;
      if (lifeSignCallback) lifeSignCallback();
      instance
        .get(getUrl("/login/toViewExamlePlant"), {
          headers: makeCallHeader(true),
        })
        .then((res) => {
          debugVerbose("Session:", instance);
          debugVerbose("demoLogin result:", res);
          cookie = res.headers["set-cookie"].toString();
          if (cookie.includes("JSESSIONID")) {
            connected = true;
            debugApi("demoLogin resolve");
            resolve({ result: 1, msg: "OK" });
          } else {
            debugApi("demoLogin reject no JSESSIONID");
            if (res.request.path.match("errorMess")) {
              reject(
                new Error(
                  `The server sent an unexpected response: ${res.request.path}`
                )
              );
            } else {
              reject(
                new Error(
                  "The server sent an unexpected response, a fatal error has occurred"
                )
              );
            }
          }
        })
        .catch((e) => {
          debugApi(
            "demoLogin err:",
            JSON.stringify(e, getJSONCircularReplacer(), "  ")
          );
          reject(e);
        });
    });
  };

  const sharePlantLogin = (key) => {
    return new Promise((resolve, reject) => {
      debugApi("sharePlantLogin:", "key:", key);
      this.connected = false;
      if (this.lifeSignCallback) this.lifeSignCallback();
      instance
        .get(this.getUrl(`/login/toSharePlant/${key}`), {
          validateStatus(status) {
            return (status >= 200 && status < 300) || status === 302;
          },
          maxRedirects: 0,
          headers: this.makeCallHeader(true),
        })
        .then((res) => {
          debugVerbose("sharePlantLogin result:", res);
          this.cookie = res.headers["set-cookie"].toString();
          if (this.cookie.includes("JSESSIONID")) {
            this.connected = true;
            debugApi("sharePlantLogin resolve");
            resolve({ result: 1, msg: "OK" });
          } else {
            debugApi("sharePlantLogin reject no JSESSIONID");
            if (res.request.path.match("errorMess")) {
              reject(
                new Error(
                  `The server sent an unexpected response: ${res.request.path}`
                )
              );
            } else {
              reject(
                new Error(
                  "The server sent an unexpected response, a fatal error has occurred"
                )
              );
            }
          }
        })
        .catch((e) => {
          debugApi(
            "sharePlantLogin err:",
            JSON.stringify(e, getJSONCircularReplacer(), "  ")
          );
          reject(e);
        });
    });
  };

  const logout = () => {
    return new Promise((resolve, reject) => {
      debugApi("logout:");
      if (this.lifeSignCallback) this.lifeSignCallback();
      this.instance
        .get(this.getUrl("/logout"), { headers: this.makeCallHeader() })
        .then((res) => {
          debugVerbose("logout result:", res);
          this.cookie = "";
          this.connected = false;
          debugApi("logout resolve");
          resolve({ result: 1, msg: "OK" });
        })
        .catch((e) => {
          debugApi(
            "logout err:",
            JSON.stringify(e, getJSONCircularReplacer(), "  ")
          );
          reject(e);
        });
    });
  };

  const getPlatList = () => {
    return new Promise((resolve, reject) => {
      debugApi("getPlatList:");
      if (this.lifeSignCallback) this.lifeSignCallback();
      this.instance
        .post(this.getUrl(`/${this.getIndex()}/getPlantListTitle`), null, {
          headers: this.makeCallHeader(),
        })
        .then((res) => {
          debugVerbose("getPlatList result:", res);
          if (Array.isArray(res.data)) {
            debugApi("getPlatList resolve:", res.data);
            resolve(res.data);
          } else {
            this.connected = false;
            debugApi("getPlatList reject");
            if (res.request.path.match("errorMess")) {
              reject(
                new Error(
                  `The server sent an unexpected response: ${res.request.path}`
                )
              );
            } else {
              reject(
                new Error(
                  "The server sent an unexpected response, a fatal error has occurred"
                )
              );
            }
          }
        })
        .catch((e) => {
          this.connected = false;
          debugApi(
            "getPlatList err:",
            JSON.stringify(e, getJSONCircularReplacer(), "  ")
          );
          reject(e);
        });
    });
  };

  const getDevicesByPlantList = (plantId, currPage) => {
    return new Promise((resolve, reject) => {
      const params = new Url.URLSearchParams({ plantId, currPage });
      debugApi(
        "getDevicesByPlantList:",
        "plantId:",
        plantId,
        "currPage:",
        currPage
      );
      if (this.lifeSignCallback) this.lifeSignCallback();
      this.instance
        .post(this.getUrl("/panel/getDevicesByPlantList"), params.toString(), {
          headers: this.makeCallHeader(),
        })
        .then((res) => {
          debugVerbose("getDevicesByPlantList result:", res);
          if (res.data && res.data.result && res.data.result === 1) {
            debugApi("getDevicesByPlantList resolve:", res.data);
            resolve(res.data);
          } else if (res.data && res.data.result) {
            debugApi("getDevicesByPlantList reject:", res.data);
            reject(
              new Error(JSON.stringify(res.data, getJSONCircularReplacer()))
            );
          } else {
            debugApi("getDevicesByPlantList reject");
            if (res.request.path.match("errorMess")) {
              reject(
                new Error(
                  `The server sent an unexpected response: ${res.request.path}`
                )
              );
            } else {
              reject(
                new Error(
                  "The server sent an unexpected response, a fatal error has occurred"
                )
              );
            }
          }
        })
        .catch((e) => {
          this.connected = false;
          debugApi(
            "getDevicesByPlantList err:",
            JSON.stringify(e, getJSONCircularReplacer(), "  ")
          );
          reject(e);
        });
    });
  };

  const getPlantData = (plantId) => {
    return new Promise((resolve, reject) => {
      const params = new Url.URLSearchParams({ plantId });
      debugApi("getPlantData:", "plantId:", plantId);
      if (this.lifeSignCallback) this.lifeSignCallback();
      this.instance
        .post(this.getUrl("/panel/getPlantData"), params.toString(), {
          headers: this.makeCallHeader(),
        })
        .then((res) => {
          debugVerbose("getPlantData result:", res);
          if (res.data && res.data.result && res.data.result === 1) {
            debugApi("getPlantData resolve:", res);
            resolve(res.data);
          } else if (res.data && res.data.result) {
            debugApi("getPlantData reject:", res.data);
            reject(
              new Error(JSON.stringify(res.data, getJSONCircularReplacer()))
            );
          } else {
            debugApi("getPlantData reject");
            if (res.request.path.match("errorMess")) {
              reject(
                new Error(
                  `The server sent an unexpected response: ${res.request.path}`
                )
              );
            } else {
              reject(
                new Error(
                  "The server sent an unexpected response, a fatal error has occurred"
                )
              );
            }
          }
        })
        .catch((e) => {
          this.connected = false;
          debugApi(
            "getPlantData err:",
            JSON.stringify(e, getJSONCircularReplacer(), "  ")
          );
          reject(e);
        });
    });
  };

  const getWeatherByPlantId = (plantId) => {
    return new Promise((resolve, reject) => {
      debugApi("getWeatherByPlantId:", "plantId:", plantId);
      const params = new Url.URLSearchParams({ plantId });
      if (this.lifeSignCallback) this.lifeSignCallback();
      this.instance
        .post(
          this.getUrl(`/${this.getIndex()}/getWeatherByPlantId`),
          params.toString(),
          { headers: this.makeCallHeader() }
        )
        .then((res) => {
          debugVerbose("getWeatherByPlantId result:", res);
          if (res.data && res.data.result && res.data.result === 1) {
            debugApi("getWeatherByPlantId resolve:", res.data);
            resolve(res.data);
          } else if (res.data && res.data.result) {
            debugApi("getWeatherByPlantId reject:", res.data);
            reject(
              new Error(JSON.stringify(res.data, getJSONCircularReplacer()))
            );
          } else {
            debugApi("getWeatherByPlantId reject");
            if (res.request.path.match("errorMess")) {
              reject(
                new Error(
                  `The server sent an unexpected response: ${res.request.path}`
                )
              );
            } else {
              reject(
                new Error(
                  "The server sent an unexpected response, a fatal error has occurred"
                )
              );
            }
          }
        })
        .catch((e) => {
          this.connected = false;
          debugApi(
            "getWeatherByPlantId err:",
            JSON.stringify(e, getJSONCircularReplacer(), "  ")
          );
          reject(e);
        });
    });
  };

  const getDevicesByPlant = (plantId) => {
    return new Promise((resolve, reject) => {
      debugApi("getDevicesByPlant:", "plantId:", plantId);
      const params = new Url.URLSearchParams({ plantId });
      if (this.lifeSignCallback) this.lifeSignCallback();
      this.instance
        .post(this.getUrl("/panel/getDevicesByPlant"), params.toString(), {
          headers: this.makeCallHeader(),
        })
        .then((res) => {
          debugVerbose("getDevicesByPlant result:", res);
          if (res.data && res.data.result && res.data.result === 1) {
            debugApi("getDevicesByPlant resolve:", res.data);
            resolve(res.data);
          } else if (res.data && res.data.result) {
            debugApi("getDevicesByPlant reject:", res.data);
            reject(
              new Error(JSON.stringify(res.data, getJSONCircularReplacer()))
            );
          } else {
            debugApi("getDevicesByPlant reject");
            if (res.request.path.match("errorMess")) {
              reject(
                new Error(
                  `The server sent an unexpected response: ${res.request.path}`
                )
              );
            } else {
              reject(
                new Error(
                  "The server sent an unexpected response, a fatal error has occurred"
                )
              );
            }
          }
        })
        .catch((e) => {
          this.connected = false;
          debugApi(
            "getDevicesByPlant err:",
            JSON.stringify(e, getJSONCircularReplacer(), "  ")
          );
          reject(e);
        });
    });
  };

  const getTotalData = (type, plantId, sn, invId) => {
    return new Promise((resolve, reject) => {
      debugApi("getTotalData:", "type", type, "plantId:", plantId, "sn:", sn);
      const splitID = sn.split("_");
      const params =
        GROWATTTYPE[type].addrParam && GROWATTTYPE[type].invIdParam
          ? new Url.URLSearchParams({
              plantId,
              [GROWATTTYPE[type].snParam]: splitID[0],
              [GROWATTTYPE[type].addrParam]: splitID[1],
              [GROWATTTYPE[type].invIdParam]: invId,
            })
          : new Url.URLSearchParams({
              plantId,
              [GROWATTTYPE[type].snParam]: sn,
            });
      if (this.lifeSignCallback) this.lifeSignCallback();
      this.instance
        .post(this.getUrl(GROWATTTYPE[type].getTotalData), params.toString(), {
          headers: this.makeCallHeader(),
        })
        .then((res) => {
          debugVerbose("getTotalData result:", res);
          if (res.data && res.data.result && res.data.result === 1) {
            debugApi("getTotalData resolve:", res.data);
            resolve(res.data);
          } else if (res.data && res.data.result) {
            debugApi("getTotalData reject:", res.data);
            reject(
              new Error(JSON.stringify(res.data, getJSONCircularReplacer()))
            );
          } else {
            debugApi("getTotalData reject");
            if (res.request.path.match("errorMess")) {
              reject(
                new Error(
                  `The server sent an unexpected response: ${res.request.path}`
                )
              );
            } else {
              reject(
                new Error(
                  "The server sent an unexpected response, a fatal error has occurred"
                )
              );
            }
          }
        })
        .catch((e) => {
          this.connected = false;
          debugApi(
            "getTotalData err:",
            JSON.stringify(e, getJSONCircularReplacer(), "  ")
          );
          reject(e);
        });
    });
  };

  const getHistory = (type, sn, startDate, endDate, start, allDatasets) => {
    return new Promise((resolve, reject) => {
      debugApi(
        "getHistory:",
        "type",
        type,
        "sn:",
        sn,
        "startDate:",
        startDate,
        "endDate:",
        endDate,
        "start:",
        start,
        "allDatasets:",
        allDatasets
      );
      if (!GROWATTTYPE[type].getHistory) {
        resolve({});
      } else {
        const params = new Url.URLSearchParams({
          [GROWATTTYPE[type].snParam]: sn,
          startDate: startDate.toISOString().substring(0, 10),
          endDate: endDate.toISOString().substring(0, 10),
          start,
        });
        if (this.lifeSignCallback) this.lifeSignCallback();
        this.instance
          .post(this.getUrl(GROWATTTYPE[type].getHistory), params.toString(), {
            headers: this.makeCallHeader(),
            // headers: { cookie: this.cookie, 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
          })
          .then((res) => {
            debugVerbose("getHistory result:", res);
            if (res.data && res.data.result && res.data.result === 1) {
              debugApi("getHistory resolve:", res.data);
              if (res.data.obj && res.data.obj.datas && res.data.obj.datas[0]) {
                if (allDatasets) {
                  res.data.obj.datas.forEach((data) => this.correctTime(data));
                  debugApi("getHistory resolve:", res.data.obj.datas);
                  resolve(res.data.obj.datas);
                } else {
                  this.correctTime(res.data.obj.datas[0]);
                  debugApi("getHistory resolve:", res.data.obj.datas[0]);
                  resolve(res.data.obj.datas[0]);
                }
              } else {
                debugApi("getHistory cant find the data");
                resolve({});
              }
            } else if (res.data && res.data.result) {
              debugApi("getHistory reject:", res.data);
              reject(
                new Error(JSON.stringify(res.data, getJSONCircularReplacer()))
              );
            } else {
              debugApi("getHistory reject");
              if (res.request.path.match("errorMess")) {
                reject(
                  new Error(
                    `The server sent an unexpected response: ${res.request.path}`
                  )
                );
              } else {
                reject(
                  new Error(
                    "The server sent an unexpected response, a fatal error has occurred"
                  )
                );
              }
            }
          })
          .catch((e) => {
            this.connected = false;
            debugApi(
              "getHistory err:",
              JSON.stringify(e, getJSONCircularReplacer(), "  ")
            );
            reject(e);
          });
      }
    });
  };

  const getStatusData = (type, plantId, sn) => {
    return new Promise((resolve, reject) => {
      debugApi("getStatusData:", "type", type, "plantId:", plantId, "sn", sn);
      const splitSn = sn.split("_");
      const params = GROWATTTYPE[type].addrParam
        ? new Url.URLSearchParams({
            plantId,
            [GROWATTTYPE[type].snParam]: splitSn[0],
            [GROWATTTYPE[type].addrParam]: splitSn[1],
          })
        : new Url.URLSearchParams({ plantId, [GROWATTTYPE[type].snParam]: sn });
      if (this.lifeSignCallback) this.lifeSignCallback();
      this.instance
        .post(this.getUrl(GROWATTTYPE[type].getStatusData), params.toString(), {
          headers: this.makeCallHeader(),
        })
        .then((res) => {
          debugVerbose("getStatusData result:", res);
          if (res.data && res.data.result && res.data.result === 1) {
            debugApi("getStatusData resolve:", res.data);
            resolve(res.data);
          } else if (res.data && res.data.result) {
            debugApi("getStatusData reject:", res.data);
            reject(
              new Error(JSON.stringify(res.data, getJSONCircularReplacer()))
            );
          } else {
            debugApi("getStatusData reject");
            if (res.request.path.match("errorMess")) {
              reject(
                new Error(
                  `The server sent an unexpected response: ${res.request.path}`
                )
              );
            } else {
              reject(
                new Error(
                  "The server sent an unexpected response, a fatal error has occurred"
                )
              );
            }
          }
        })
        .catch((e) => {
          this.connected = false;
          debugApi(
            "getStatusData err:",
            JSON.stringify(e, getJSONCircularReplacer(), "  ")
          );
          reject(e);
        });
    });
  };

  const getDataLoggerRegister = (dataLogSn, addr) => {
    const param = {
      action: "readDatalogParam",
      dataLogSn,
      paramType: "set_any_reg",
      addr,
    };
    return this.comDataLogger(param);
  };

  const setDataLoggerRegister = (dataLogSn, addr, value) => {
    const param = {
      action: "setDatalogParam",
      dataLogSn,
      paramType: LOGGERFUNCTION.REGISTER,
      param_1: addr,
      param_2: value,
    };
    return this.comDataLogger(param);
  };

  const setDataLoggerPara = (dataLogSn, paramType, value) => {
    const param = {
      action: "setDatalogParam",
      dataLogSn,
      paramType,
      param_1: value,
      param_2: "",
    };
    return this.comDataLogger(param);
  };

  const setDataLoggerRestart = (dataLogSn) => {
    const param = { action: "restartDatalog", dataLogSn };
    return this.comDataLogger(param);
  };

  const checkDataLoggerFirmware = (type, version) => {
    const param = {
      action: "checkFirmwareVersion",
      deviceTypeIndicate: type,
      firmwareVersion: version,
    };
    return this.comDataLogger(param);
  };

  const comDataLogger = (param) => {
    return new Promise((resolve, reject) => {
      debugApi("comDataLogger:", param);
      const params = new Url.URLSearchParams(param);
      if (this.lifeSignCallback) this.lifeSignCallback();
      this.instance
        .post(this.getUrl("/ftp.do"), params.toString(), {
          headers: this.makeCallHeader(),
        })
        .then((res) => {
          debugVerbose("comDataLogger result:", res);
          if (res.data && typeof res.data.success !== "undefined") {
            debugApi(
              "comDataLogger resolve:",
              JSON.stringify(res.data, getJSONCircularReplacer())
            );
            resolve(res.data);
          } else if (res.data) {
            debugApi("comDataLogger reject:", res.data);
            reject(
              new Error(JSON.stringify(res.data, getJSONCircularReplacer()))
            );
          } else {
            debugApi("comDataLogger reject");
            if (res.request.path.match("errorMess")) {
              reject(
                new Error(
                  `The server sent an unexpected response: ${res.request.path}`
                )
              );
            } else {
              reject(
                new Error(
                  "The server sent an unexpected response, a fatal error has occurred"
                )
              );
            }
          }
        })
        .catch((e) => {
          this.connected = false;
          debugApi(
            "comDataLogger err:",
            JSON.stringify(e, getJSONCircularReplacer(), "  ")
          );
          reject(e);
        });
    });
  };

  // eslint-disable-next-line class-methods-use-this
  const getInverterCommunication = (type) => {
    debugApi("getInverterCommunication:", "type", type);
    const ret = {};
    if (typeof GROWATTTYPE[type].comInverter === "object")
      Object.keys(GROWATTTYPE[type].comInverter).forEach((key) => {
        ret[key] = { name: GROWATTTYPE[type].comInverter[key].name, param: {} };
        Object.assign(ret[key].param, GROWATTTYPE[type].comInverter[key].param);
        if (GROWATTTYPE[type].comInverter[key].isSubread) {
          ret[key].isSubread = GROWATTTYPE[type].comInverter[key].isSubread;
        }
        if (GROWATTTYPE[type].comInverter[key].subRead) {
          ret[key].subRead = [];
          Object.assign(
            ret[key].subRead,
            GROWATTTYPE[type].comInverter[key].subRead
          );
        }
      });
    debugApi("getInverterCommunication: return", "ret", ret);
    return ret;
  };

  const getInverterSetting = (type, func, serialNum) => {
    debugApi(
      "getInverterSetting:",
      "type",
      type,
      "func",
      func,
      "serialNum",
      serialNum
    );
    const param = {
      url: { action: "", paramId: "", serialNum, startAddr: -1, endAddr: -1 },
      action: "readParam",
      base: "comInverter",
      func,
    };
    return this.comInverter(type, param, this.parseRetDate);
  };

  const setInverterSetting = (type, func, serialNum, val) => {
    debugApi(
      "setInverterSetting:",
      "type",
      type,
      "func",
      func,
      "serialNum",
      serialNum,
      "val",
      val
    );
    const param = {
      url: { action: "", serialNum, type: "" },
      val,
      action: "writeParam",
      base: "comInverter",
      func,
    };
    return this.comInverter(type, param, this.parseRetDate);
  };

  const comInverter = (type, paramorgi) => {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      debugApi("comInverter:", "type", type, "paramorgi", paramorgi);
      let checkRet = null;
      const param = paramorgi.url;
      const gt = GROWATTTYPE[type];
      let OK = true;
      try {
        if (typeof paramorgi.action === "string") {
          if (
            typeof gt === "object" &&
            typeof gt[paramorgi.action] === "string"
          ) {
            param.action = gt[paramorgi.action];
          } else {
            throw new Error(
              `The action ${paramorgi.action} is unknown for invertertype ${type}`
            );
          }
        }
        if (
          typeof paramorgi.base === "string" &&
          typeof gt[paramorgi.base] === "object" &&
          typeof gt[paramorgi.base][paramorgi.func] === "object"
        ) {
          const b = gt[paramorgi.base][paramorgi.func];
          if (
            typeof param.paramId !== "undefined" &&
            typeof b.paramId === "string"
          ) {
            param.paramId = b.paramId;
            checkRet = b.parseRet;
          }
          if (typeof param.type !== "undefined" && typeof b.type === "string") {
            param.type = b.type;
            if (
              typeof paramorgi.val === "object" &&
              typeof b.param === "object"
            ) {
              const p = b.param;
              Object.keys(p).forEach((name) => {
                if (typeof paramorgi.val[name] !== "undefined") {
                  let ok = true;
                  [param[name], ok] = PARSEIN[p[name].type](
                    paramorgi.val[name]
                  );
                  if (!ok) {
                    throw new Error(
                      `The value ${p[name].name} is incorrect for ${p[name].type} for function ${paramorgi.func} on invertertype ${type}`
                    );
                  }
                } else {
                  throw new Error(
                    `The value ${p[name].name} is missing for send function ${paramorgi.func} on invertertype ${type}`
                  );
                }
              });
            }
          }
        } else {
          throw new Error(
            `The function ${paramorgi.func} is unknown for invertertype ${type}`
          );
        }
      } catch (e) {
        OK = false;
        reject(e);
      }
      if (!OK) {
        return;
      }
      const [qresolve, qreject] = await this.queue.addTask(resolve, reject);
      if (!this.isConnected()) {
        qreject(new Error(`The server is not connected`));
        return;
      }
      debugApi("comInverter:", "param", param);
      const params = new Url.URLSearchParams(param);
      this.instance
        .post(this.getUrl("/tcpSet.do"), params.toString(), {
          headers: this.makeCallHeader(),
        })
        .then((res) => {
          debugVerbose("comInverter result:", res);
          if (res.data && typeof res.data.success !== "undefined") {
            debugApi(
              "comInverter resolve:",
              JSON.stringify(res.data, getJSONCircularReplacer())
            );
            if (typeof res.data.msg !== "undefined" && res.data.msg === "") {
              this.queue.taskFinished();
              this.comInverter(type, paramorgi, checkRet)
                .then((r) => {
                  qresolve(r);
                })
                .catch((e) => {
                  qreject(e);
                });
            } else if (typeof checkRet !== "undefined" && checkRet !== null) {
              checkRet(res.data, qresolve);
            } else {
              qresolve(res.data);
            }
          } else if (res.data) {
            debugApi("comInverter reject:", res.data);
            qreject(
              new Error(JSON.stringify(res.data, getJSONCircularReplacer()))
            );
          } else {
            debugApi("comInverter reject");
            if (res.request.path.match("errorMess")) {
              qreject(
                new Error(
                  `The server sent an unexpected response: ${res.request.path}`
                )
              );
            } else {
              qreject(
                new Error(
                  "The server sent an unexpected response, a fatal error has occurred"
                )
              );
            }
          }
        })
        .catch((e) => {
          debugApi(
            "comInverter err:",
            JSON.stringify(e, getJSONCircularReplacer(), "  ")
          );
          qreject(e);
        });
    });
  };

  const getDataLoggers = () => {
    async function doIt(resolve, reject) {
      let loggers = [];
      const plants = await this.getPlatList().catch((e) => {
        debugApi("getDataLoggers getPlatList err:", e);
        reject(e);
      });
      if (plants) {
        // eslint-disable-next-line no-restricted-syntax
        for (const plant of plants) {
          let res = {};
          let curPage = 0;
          do {
            curPage += 1;
            // eslint-disable-next-line no-await-in-loop
            res = await this.getDataLogger(plant.id, curPage).catch((e) => {
              debugApi("getDataLoggers getDataLogger err:", e);
              reject(e);
            });
            if (res.datas) {
              loggers = loggers.concat(res.datas);
            }
            curPage += 1;
            if (res.currPage) {
              curPage = res.currPage;
            }
          } while (!!res.currPage && !!res.pages && res.currPage < res.pages);
        }
      }
      resolve(loggers);
    }
    return new Promise(doIt.bind(this));
  };

  const getDataLogger = (plantId, currPage = 1) => {
    return new Promise((resolve, reject) => {
      debugApi("getDataLogger:", plantId, currPage);
      const params = new Url.URLSearchParams({
        datalogSn: "",
        plantId,
        currPage,
      });
      if (this.lifeSignCallback) this.lifeSignCallback();
      this.instance
        .post(this.getUrl("/device/getDatalogList"), params.toString(), {
          headers: this.makeCallHeader(),
        })
        .then((res) => {
          debugVerbose("getDataLogger result:", res);
          if (res.data && typeof res.data === "object") {
            debugApi("getDataLogger resolve:", res.data);
            resolve(res.data);
          } else {
            debugApi("getDataLogger reject");
            if (res.request.path.match("errorMess")) {
              reject(
                new Error(
                  `The server sent an unexpected response: ${res.request.path}`
                )
              );
            } else {
              reject(
                new Error(
                  "The server sent an unexpected response, a fatal error has occurred"
                )
              );
            }
          }
        })
        .catch((e) => {
          this.connected = false;
          debugApi(
            "getDataLogger err:",
            JSON.stringify(e, getJSONCircularReplacer(), "  ")
          );
          reject(e);
        });
    });
  };

  /* eslint-disable-next-line class-methods-use-this */
  const correctTime = (struct) => {
    function makeTime(time) {
      if (
        typeof time.year !== "undefined" &&
        typeof time.month !== "undefined" &&
        typeof time.dayOfMonth !== "undefined" &&
        typeof time.hourOfDay !== "undefined" &&
        typeof time.minute !== "undefined" &&
        typeof time.second !== "undefined"
      ) {
        return new Date(
          time.year,
          time.month,
          time.dayOfMonth,
          time.hourOfDay,
          time.minute,
          time.second
        ).toISOString();
      }
      return new Date().toISOString();
    }
    if (typeof struct.time !== "undefined") {
      struct.time = makeTime(struct.time);
    }
    if (typeof struct.calendar !== "undefined") {
      struct.calendar = makeTime(struct.calendar);
    }
  };

  const getAllPlantData = (opt) => {
    /* eslint-disable-next-line no-async-promise-executor */
    return new Promise(async (resolve, reject) => {
      let options = opt;
      debugApi("getAllPlantData", "options:", options);
      const result = {};
      if (typeof options !== "object") {
        options = {};
      }
      if (typeof options.plantData === "undefined") {
        options.plantData = true;
      }
      if (typeof options.deviceData === "undefined") {
        options.deviceData = true;
      }
      if (typeof options.weather === "undefined") {
        options.weather = true;
      }
      debugApi("getAllPlantData", "options:", options);
      const plants = await this.getPlatList().catch((e) => {
        debugApi("getAllPlantData getPlatList err:", e);
        reject(e);
      });
      if (plants) {
        for (let i = 0; i < plants.length; i += 1) {
          const plant = plants[i];
          if (
            typeof options.plantId === "undefined" ||
            plant.id.toString() === options.plantId.toString()
          ) {
            result[plant.id] = plant;
            if (options.plantData) {
              result[plant.id].plantData = {};
              /* eslint-disable-next-line no-await-in-loop */
              const plantData = await this.getPlantData(plant.id).catch((e) => {
                debugApi("getAllPlantData getPlantData err:", e);
                reject(e);
              });
              if (plantData && plantData.obj) {
                result[plant.id].plantData = plantData.obj;
              }
            }
            if (options.weather) {
              result[plant.id].weather = {};
              /* eslint-disable-next-line no-await-in-loop */
              const weather = await this.getWeatherByPlantId(plant.id).catch(
                (e) => {
                  debugApi("getAllPlantData getWeatherByPlantId err:", e);
                  reject(e);
                }
              );
              if (weather && weather.obj) {
                result[plant.id].weather = weather.obj;
              }
            }
            /* eslint-disable-next-line no-await-in-loop */
            result[plant.id].devices = await this.getAllPlantDeviceData(
              plant.id,
              options
            ).catch((e) => {
              debugApi("getAllPlantData getAllPlantDeviceData err:", e);
              reject(e);
            });

            if (options.deviceData) {
              /* eslint-disable-next-line no-await-in-loop */
              const devices = await this.getDevicesByPlantList(
                plant.id,
                1
              ).catch((e) => {
                debugApi("getAllPlantData getDevicesByPlantList err:", e);
                reject(e);
              });
              if (devices && devices.obj && devices.obj.datas) {
                if (devices.obj.pages && devices.obj.pages > 1) {
                  for (let p = 1; p < devices.obj.pages; p += 1) {
                    /* eslint-disable-next-line no-await-in-loop */
                    const devicesPlus = await this.getDevicesByPlantList(
                      plant.id,
                      p
                    ).catch((e) => {
                      debugApi("getAllPlantData getDevicesByPlantList err:", e);
                      reject(e);
                    });
                    devices.obj.datas = devices.obj.datas.concat(
                      devicesPlus.obj.datas
                    );
                  }
                }
                for (let n = 0; n < devices.obj.datas.length; n += 1) {
                  const devData = devices.obj.datas[n];
                  if (!result[plant.id].devices) {
                    result[plant.id].devices = {};
                  }
                  if (
                    !result[plant.id].devices[devData.sn] &&
                    devData.plantId
                  ) {
                    /* eslint-disable-next-line no-await-in-loop */
                    result[plant.id].devices[devData.sn] =
                      await this.getPlantDeviceData(
                        devData.plantId,
                        devData.deviceTypeName,
                        devData.sn,
                        0,
                        options
                      ).catch((e) => {
                        debugApi(
                          `getAllPlantDeviceData getPlantDeviceData ${devData.deviceTypeName} err:`,
                          e
                        );
                        reject(e);
                      });
                  }
                  if (!result[plant.id].devices[devData.sn]) {
                    result[plant.id].devices[devData.sn] = {};
                  }
                  result[plant.id].devices[devData.sn].deviceData = devData;
                }
              }
            }
          }
        }
      }
      debugVerbose(
        "getAllPlantData resolve:",
        JSON.stringify(result, getJSONCircularReplacer(), "  ")
      );
      resolve(result);
    });
  };

  const getAllPlantDeviceData = (plantId, opt) => {
    /* eslint-disable-next-line no-async-promise-executor */
    return new Promise(async (resolve, reject) => {
      let options = opt;
      debugApi(
        "getAllPlantDeviceData:",
        "plantId:",
        plantId,
        "options:",
        options
      );
      let result = {};
      if (typeof options !== "object") {
        options = {};
      }
      if (typeof options.deviceTyp === "undefined") {
        options.deviceTyp = false;
      }
      debugApi("getAllPlantDeviceData", "options:", options);
      const device = await this.getDevicesByPlant(plantId).catch((e) => {
        debugApi("getAllPlantDeviceData getDevicesByPlant err:", e);
        reject(e);
      });
      if (device && device.obj) {
        result = {};
        const objs = Object.keys(device.obj);
        for (let o = 0; o < objs.length; o += 1) {
          const growattType = objs[o];
          if (growattType !== "" && GROWATTTYPE[growattType]) {
            for (let a = 0; a < device.obj[growattType].length; a += 1) {
              if (device.obj[growattType][a].length > 2) {
                let serialNr = device.obj[growattType][a][0];
                const invId = device.obj[growattType][a][3];
                if (GROWATTTYPE[growattType].atIndex) {
                  serialNr += `@${
                    device.obj[growattType][a][GROWATTTYPE[growattType].atIndex]
                  }`;
                }
                /* eslint-disable-next-line no-await-in-loop */
                result[serialNr] = await this.getPlantDeviceData(
                  plantId,
                  growattType,
                  serialNr,
                  invId,
                  options
                ).catch((e) => {
                  debugApi(
                    `getAllPlantDeviceData getPlantDeviceData ${growattType} err:`,
                    e
                  );
                  reject(e);
                });
                if (options.deviceType) {
                  result[serialNr][growattType] = device.obj[growattType][a];
                }
              }
            }
          }
        }
      }
      debugVerbose(
        "getAllPlantDeviceData resolve:",
        JSON.stringify(result, getJSONCircularReplacer(), "  ")
      );
      resolve(result);
    });
  };

  const getPlantDeviceData = (plantId, growattType, serialNr, invId, opt) => {
    /* eslint-disable-next-line no-async-promise-executor */
    return new Promise(async (resolve, reject) => {
      let options = opt;
      debugApi(
        "getPlantDeviceData:",
        "plantId",
        plantId,
        "growattType",
        growattType,
        "serialNr",
        serialNr,
        "invId",
        invId,
        "options:",
        options
      );
      let result = {};
      if (typeof options !== "object") {
        options = {};
      }
      if (typeof options.totalData === "undefined") {
        options.totalData = true;
      }
      if (typeof options.statusData === "undefined") {
        options.statusData = true;
      }
      if (typeof options.growattType === "undefined") {
        options.growattType = true;
      }
      if (typeof options.historyLast === "undefined") {
        options.historyLast = true;
      }
      if (typeof options.historyAll === "undefined") {
        options.historyAll = false;
      }
      if (typeof options.historyLastStartDate === "undefined") {
        options.historyLastStartDate = new Date(
          new Date().setDate(new Date().getDate() - 1)
        );
      }
      if (typeof options.historyLastEndDate === "undefined") {
        options.historyLastEndDate = new Date(
          new Date().setDate(new Date().getDate() + 1)
        );
      }
      if (typeof options.historyStart === "undefined") {
        options.historyStart = 0;
      }
      debugApi("getPlantDeviceData", "options:", options);
      result = {};
      if (growattType !== "" && GROWATTTYPE[growattType]) {
        if (options.growattType) {
          result.growattType = growattType;
        }
        if (options.totalData) {
          const totalData = await this.getTotalData(
            growattType,
            plantId,
            serialNr,
            invId
          ).catch((e) => {
            debugApi(`getPlantDeviceData getTotalData ${growattType} err:`, e);
            reject(e);
          });
          if (totalData && totalData.obj) {
            result.totalData = totalData.obj;
          }
        }
        if (options.statusData && GROWATTTYPE[growattType].getStatusData) {
          const statusData = await this.getStatusData(
            growattType,
            plantId,
            serialNr
          ).catch((e) => {
            debugApi(`getPlantDeviceData getStatusData ${growattType} err:`, e);
            reject(e);
          });
          if (statusData && statusData.obj) {
            result.statusData = statusData.obj;
          }
        }
        if (options.historyLast || options.historyAll) {
          const historyLast = await this.getHistory(
            growattType,
            serialNr,
            options.historyLastStartDate,
            options.historyLastEndDate,
            options.historyStart,
            options.historyAll
          ).catch((e) => {
            debugApi(`getPlantDeviceData getHistory ${growattType} err:`, e);
            reject(e);
          });
          if (historyLast) {
            if (options.historyAll) {
              result.historyAll = historyLast;
            } else {
              result.historyLast = historyLast;
            }
          }
        }
      }
      debugVerbose(
        "getPlantDeviceData resolve:",
        JSON.stringify(result, getJSONCircularReplacer(), "  ")
      );
      resolve(result);
    });
  };

  return {
    config,
    queue,
    connected,
    cookie,
    axios,
    getUrl,
    getIndex,
    isConnected,
    extractSession,
    makeCallHeader,
    demoLogin,
    login,
    sharePlantLogin,
    logout,
    getPlatList,
    getDevicesByPlantList,
    getAllPlantData,
    getPlantData,
    getWeatherByPlantId,
    getDevicesByPlant,
    getPlantDeviceData,
    getTotalData,
    getHistory,
    getStatusData,
    getDataLogger,
    getDataLoggers,
    getDataLoggerRegister,
    setDataLoggerRegister,
    setDataLoggerPara,
    setDataLoggerRestart,
    checkDataLoggerFirmware,
    getInverterCommunication,
    getInverterSetting,
    setInverterSetting,
    comInverter,
    correctTime,
    getAllPlantDeviceData,
    comDataLogger,
  };
};

export default growatt;

// module.exports.LOGGERREGISTER = LOGGERREGISTER;
// module.exports.LOGGERFUNCTION = LOGGERFUNCTION;
