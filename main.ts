import { SQSClient, ReceiveMessageCommand, DeleteMessageBatchCommand, ReceiveMessageCommandOutput, Message } from "@aws-sdk/client-sqs";
const redis = require("redis");
const h3 = require("h3-js");

const sqsQueueUrl = process.env.SQS_QUEUE_URL;
const sqsParams = {
  MaxNumberOfMessages: 10,
  QueueUrl: sqsQueueUrl,
  VisibilityTimeout: 20,
  WaitTimeSeconds: 10
};

const redisParams = { host: process.env.REDIS_HOST };

async function processReceivedMessage(redisClient: any, msg: Message) : Promise<string> {
  return new Promise((resolve, reject) => {
    const json = JSON.parse(msg.Body!);
    var deviceId = json.deviceId;
    var dev_ts = json.timestamp;
    var srv_ts = json.server_timestamp;
    var wrk_ts = Date.now();
    var fv = json.firmwareVersion.split(".").join("_");
    var batt = json.battery;
    var gps_lat = json.gps_lat;
    var gps_lng = json.gps_lng;
    var gps_alt = json.gps_alt;
    var lnglat = gps_lng.toFixed(11) + "," + gps_lat.toFixed(11)
    
    var h3r0 = h3.geoToH3(gps_lat, gps_lng, 0);
    var h3r1 = h3.geoToH3(gps_lat, gps_lng, 1);
    var h3r2 = h3.geoToH3(gps_lat, gps_lng, 2);
    var h3r3 = h3.geoToH3(gps_lat, gps_lng, 3);
    var h3r4 = h3.geoToH3(gps_lat, gps_lng, 4);
    var h3r5 = h3.geoToH3(gps_lat, gps_lng, 5);
    var h3r6 = h3.geoToH3(gps_lat, gps_lng, 6);
    var h3r7 = h3.geoToH3(gps_lat, gps_lng, 7);
    var h3r8 = h3.geoToH3(gps_lat, gps_lng, 8);
    var h3r9 = h3.geoToH3(gps_lat, gps_lng, 9);
    var h3r10 = h3.geoToH3(gps_lat, gps_lng, 10);
    var h3r11 = h3.geoToH3(gps_lat, gps_lng, 11);
    var h3r12 = h3.geoToH3(gps_lat, gps_lng, 12);
    var h3r13 = h3.geoToH3(gps_lat, gps_lng, 13);
    var h3r14 = h3.geoToH3(gps_lat, gps_lng, 14);
    var h3r15 = h3.geoToH3(gps_lat, gps_lng, 15);

    var seq = json.seq;
    var top = json.topic;
    var key : string = `DEVLOC:${deviceId}:${top}`;
    
    redisClient.hset(key, 'deviceId', deviceId, 'topic', top,
      'lnglat', lnglat, 'lng', gps_lng, 'lat', gps_lat, 'alt', gps_alt,
      'dts', dev_ts, 'sts', srv_ts, 'wts', wrk_ts, 'fv', fv, 'batt', batt, 'seq', seq,
      'h3r0', h3r0, 'h3r1', h3r1, 'h3r2', h3r2, 'h3r3', h3r3, 'h3r4', h3r4, 'h3r5', h3r5, 
      'h3r6', h3r6, 'h3r7', h3r7, 'h3r8', h3r8, 'h3r9', h3r9, 'h3r10', h3r10,
      'h3r11', h3r11, 'h3r12', h3r12, 'h3r13', h3r13, 'h3r14', h3r14, 'h3r15', h3r15,
      function(err: any, res: any) {

        const msg = {
          deviceId: deviceId,
          ts: wrk_ts,
          fv: fv,
          batt: batt,
          gps: {
              lat: gps_lat,
              lng: gps_lng,
              alt: gps_alt
          },
          seq: seq
        };
        const json = JSON.stringify(msg);

        if (err) {
          console.log("Failed " + json);
          console.error(err);
          reject("Failed");
        } else {
          var sk = key.replace("DEVLOC", "STREAMDEV"); // "STREAM:test-299212:topic_1"
          redisClient.xadd(sk, "*", "dts", dev_ts, "sts", srv_ts, "wts", wrk_ts, "rts", Date.now(), "seq", seq);
          
          console.log("Success " + json);
          resolve("Success");
        }
      }
    );
  });
}

async function processReceivedMessages(redisClient: any, sqsClient: SQSClient, messages : Message[]) {
  var promises : Promise<string>[] = [];
  for (const msg of messages) {
    if (msg.Body === undefined)
      continue;

      promises.push(processReceivedMessage(redisClient, msg));
  }

  try {
    // TODO: Sort and process messages in order for same device/topic
    // NOTE: Block waiting and processing will have not have messages in order anyways
    await Promise.all(promises);

    var deleteBatchParams = {
      QueueUrl: sqsQueueUrl,
      Entries: (messages.map((message, index) => ({
        Id: `${index}`,
        ReceiptHandle: message.ReceiptHandle,
      })))
    };

    const dmbc = new DeleteMessageBatchCommand(deleteBatchParams);
    await sqsClient.send(dmbc);
  } catch (err) {
    console.log("Error deleting batch messages", err);
  }
}

const run = async () => {
  const redisClient = redis.createClient(redisParams);
  const sqsClient = new SQSClient({ region: process.env.AWS_REGION });
  
  redisClient.on("error", function(error: any) {
    console.error(error);
  });
  
  while (true) {
    try {
      const rmc = new ReceiveMessageCommand(sqsParams);
      const data : ReceiveMessageCommandOutput = await sqsClient.send(rmc);
      if (data.Messages) {
        // NOTE: Could await next call but performance is better is called async
        processReceivedMessages(redisClient, sqsClient, data.Messages);
      }
    } catch (err) {
      console.log("Error handling redis messages", err);
    } finally {
      console.log("Waiting...");
    }
  }
}


run();
