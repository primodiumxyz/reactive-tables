import createDebug from "debug";

export const debug = createDebug("primodium:sync-stack");
export const error = createDebug("primodium:sync-stack");

// Pipe debug output to stdout instead of stderr
debug.log = console.debug.bind(console);

// Pipe error output to stderr
error.log = console.error.bind(console);
