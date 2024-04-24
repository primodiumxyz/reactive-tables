import createDebug from "debug";

export const debug = createDebug("primodium:tiny-base-wrapper");
export const error = createDebug("primodium:tiny-base-wrapper");
// Pipe debug output to stdout instead of stderr
debug.log = console.debug.bind(console);
// Pipe error output to stderr
error.log = console.error.bind(console);
