const virtualUrl = "data:text/javascript,export const env = globalThis.__CLOUDFLARE_ENV__ ?? {};";

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "cloudflare:workers") {
    return { url: virtualUrl, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
