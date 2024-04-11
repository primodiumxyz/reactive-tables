import { createWriter } from "./createWriter";

export const consoleWriter = createWriter({
  delete(log) {
    console.log("delete", log);
  },
  set(log) {
    console.log("set", log);
  },
  updateDynamic(log) {
    console.log("updateDynamic", log);
  },
  updateStatic(log) {
    console.log("updateStatic", log);
  },
});
