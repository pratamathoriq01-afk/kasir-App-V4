// Background Web Worker Thread - Bypasses Chrome Background Tab Throttling
let intervalId = null;

self.onmessage = function (e) {
  if (e.data === "start") {
    if (!intervalId) {
      intervalId = setInterval(() => {
        self.postMessage("tick");
      }, 400);
    }
  } else if (e.data === "stop") {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }
};
