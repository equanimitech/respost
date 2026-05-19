import nextConfig from "eslint-config-next";
import coreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextConfig,
  ...coreWebVitals,
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts"] },
];

export default config;
