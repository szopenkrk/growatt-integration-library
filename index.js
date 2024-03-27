"use strict";
const api = require("growatt");

const user = "xxx";
const passwort = "xx";
const options = {};

async function test() {
  //Login to growatt
  const growatt = new api({});
  let login = await growatt.login(user, passwort).catch((e) => {
    console.log(e);
  });
  console.log("login:", login);

  //Get plant data
  let getAllPlantData = await growatt.getAllPlantData(options).catch((e) => {
    console.log(e);
  });
  console.log("getAllPlatData:", JSON.stringify(getAllPlantData, null, " "));

  //Logout from growatt
  let logout = await growatt.logout().catch((e) => {
    console.log(e);
  });
  console.log("logout:", logout);
}

test();
