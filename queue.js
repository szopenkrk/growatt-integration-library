const debugQueue = require("debug")("growatt:queue");

function createQueue() {
  const q = [];
  let inUse = false;

  function addTask(funcA, funcB) {
    debugQueue(`addTask: `);
    return new Promise((resolve) => {
      q.push(() => {
        resolve([changeR(funcA), changeR(funcB)]);
      });
      relaseNext();
    });
  }

  function taskFinished() {
    debugQueue(`taskFinished: this.inUser ${inUse}`);
    inUse = false;
    relaseNext();
  }

  function relaseNext() {
    debugQueue(`relaseNext: this.inUser ${inUse}`);
    if (!inUse) {
      const resolve = q.shift();
      if (typeof resolve !== "undefined") {
        inUse = true;
        debugQueue(`relaseNext nextFound: this.inUser ${inUse}`);
        resolve();
      }
    }
  }

  function changeR(func) {
    debugQueue(`changeR: `);
    return (v) => {
      taskFinished();
      func(v);
    };
  }

  return {
    addTask,
  };
}

module.exports = createQueue;
