// Reads a required environment variable, throwing a clear error if it's
// missing. Returning `string` (not `string | undefined`) means callers
// get a properly narrowed type without relying on control-flow analysis
// across function boundaries, which TypeScript can't do reliably.
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} environment variable`);
  }
  return value;
}
