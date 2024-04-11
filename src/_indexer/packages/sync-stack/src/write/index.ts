import * as writers from "./writers";

export const Write = {
  toCustom: writers.createWriter,
  toConsole: writers.consoleWriter,
  toRecs: writers.recsWriter,
};
