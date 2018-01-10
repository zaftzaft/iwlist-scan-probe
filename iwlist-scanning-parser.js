'use strict';

const fs = require("fs");
const execSync = require("child_process").execSync;

const channelMap = {
  2412: 1, 2417: 2, 2422: 3, 2427: 4, 2432: 5,
  2437: 6, 2442: 7, 2447: 8, 2452: 9, 2457:10,
  2462: 11, 2467: 12, 2472: 13, 2484: 14,

  5180: 36, 5200: 40, 5220: 44, 5240: 48,
  5260: 52, 5280: 56, 5300: 60, 5320: 64,

  5500: 100,
  5520: 104, 5540: 108, 5560: 112, 5580: 116, 5600: 120,
  5620: 124, 5640: 128, 5660: 132, 5680: 136, 5700: 140,

  5745: 149, 5765: 153, 5785: 157, 5805: 161
};


const iwlistScanningParser = data => {

  let results = [];
  let obj = null;

  data.split("\n").forEach(raw => {
    let line = raw.trim();

    if(/^Cell/.test(line)) {
      if(obj) {
        results.push(Object.assign({}, obj));
      }
      obj = {};

      obj.mac = line.split("Address: ")[1];
    }
    else if(/^ESSID/.test(line)) {
      let ssid = line.split("SSID:")[1].replace(/\"/g, "");
      ssid = ssid.replace(/\\x/g, ".x");
      obj.ssid = ssid;
    }
    else if(/^Frequency/.test(line)) {
      let ch = line.match(/Channel (\d+)/);
      if(ch && ch[1]) {
        obj.channel = parseInt(ch[1], 10);
      }
      else {
        let freq = line.match(/:([\.\d]+) /);
        obj.channel = channelMap[+freq[1] * 1000];
      }
    }
    else if(/^Quality/.test(line)) {
      obj.signal = -parseInt(line.match(/Signal level=-(\d+)/)[1], 10);
    }

  });

  return results;
};



execSync("ip link set dev ra0 up");
let data = ""+execSync("iwlist ra0 scanning");

//let data = ""+require("fs").readFileSync("./a", "utf8");

//console.log(data);

let val = iwlistScanningParser(data).map(o => {
  return `iw{mac="${o.mac}",ssid="${o.ssid}",channel="${o.channel}"} ${o.signal}`;
}).join("\n");




fs.writeFileSync("/opt/node_exporter_directory/iw.prom.$$", `${val}\n`, "utf8");
fs.renameSync("/opt/node_exporter_directory/iw.prom.$$", "/opt/node_exporter_directory/iw.prom");


