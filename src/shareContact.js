"use strict";

var utils = require("../utils");
var log = require("npmlog");

module.exports = function (defaultFuncs, api, ctx) {
  return async function shareContact(text, senderID, threadID, callback) {
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
        data;
      };
    }

    ctx.wsReqNumber += 1;
    let taskNumber = ++ctx.wsTaskNumber;

    var form = JSON.stringify({
      app_id: "2220391788200892",
      payload: JSON.stringify({
        tasks: [
          {
            label: "359",
            payload: JSON.stringify({
              contact_id: senderID,
              sync_group: 1,
              text: text || "",
              thread_id: threadID,
            }),
            queue_name: "messenger_contact_sharing",
            task_id: taskNumber,
            failure_count: null,
          },
        ],
        epoch_id: utils.generateOfflineThreadingID(),
        version_id: "7214102258676893",
      }),
      request_id: ctx.wsReqNumber,
      type: 3,
    });
    ctx.mqttClient.publish("/ls_req", form);

    return returnPromise;
  };
};
