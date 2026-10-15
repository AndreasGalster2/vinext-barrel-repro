import { Toast } from "@heroui/react";

// Minimal repro: a server component importing ONE component from a
// sideEffects:false barrel. Tree-shaking would drop every unused branch
// (including the react-aria `client-only` marker three hops down:
// barrel index -> toast/index.js -> toast-queue.js -> Toast.mjs), and
// Next.js builds this fine — but `vite build` fails in
// `[plugin rsc:validate-imports]` because the validator walks re-exports
// pre-shake.
//
// Two fix shapes, depending on the chain:
// 1. Pure-barrel chains (e.g. Skeleton): import from the official subpath
//    (`@heroui/react/skeleton`) — same modules, both builders happy.
// 2. Chains ending in a real directive-less module (this file:
//    toast-queue.js): subpaths do NOT help (`./toast` re-exports the
//    queue). Wrap the usage in an explicit `"use client"` boundary
//    component instead; the client bundle is byte-identical either way.
export default function Page() {
  return (
    <main>
      <h1>vinext barrel repro</h1>
      <Toast.Provider />
    </main>
  );
}
