import createDebug from "debug";

export const debug = createDebug("primodium:reactive-tables");
export const error = createDebug("primodium:reactive-tables");
// Pipe debug output to stdout instead of stderr
debug.log = console.debug.bind(console);
// Pipe error output to stderr
error.log = console.error.bind(console);

if (process.env.DEBUG) {
  debug.enabled = true;
  error.enabled = true;
}
