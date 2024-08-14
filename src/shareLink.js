"use strict";

var utils = require("../utils");
var log = require("npmlog");

module.exports = function (defaultFuncs, api, ctx) {
  return async function shareLink(text, url, threadID, callback) {
    if (!ctx.mqttClient) {
      throw new Error("Not connected to MQTT");
    }

    var resolveFunc = function () {};
    var rejectFunc = function () {};
    var returnPromise = new Promise(function (resolve, reject) {
      resolveFunc = resolve;
      rejectFunc = reject;
    });
    if (!callback) {
      callback = function (err, data) {
        if (err) return rejectFunc(err);
        resolveFunc(data);
      };
    }

    ctx.wsReqNumber += 1;
    let taskNumber = ++ctx.wsTaskNumber;

    ctx.mqttClient.publish(
      "/ls_req",
      JSON.stringify({
        app_id: "2220391788200892",
        payload: JSON.stringify({
          tasks: [
            {
              label: 46,
              payload: JSON.stringify({
                otid: utils.generateOfflineThreadingID(),
                source: 524289,
                sync_group: 1,
                send_type: 6,
                mark_thread_read: 0,
                url: url || "",
                text: text || "",
                thread_id: threadID,
                initiating_source: 0,
              }),
              queue_name: threadID,
              task_id: taskNumber,
              failure_count: null,
            },
          ],
          epoch_id: utils.generateOfflineThreadingID(),
          version_id: "7191105584331330",
        }),
        request_id: ctx.wsReqNumber,
        type: 3,
      }),
      {
        qos: 1,
        retain: false,
      },
    );
    return returnPromise;
  };
};
