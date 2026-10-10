// eslint-config-next v16 ships native flat configs, so we import them directly.
// (Wrapping them in FlatCompat — the create-next-app default — crashes ESLint 9
//  with "Converting circular structure to JSON" via the react plugin.)
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      "react/jsx-no-target-blank": ["error", {
        allowReferrer: false,
        enforceDynamicLinks: "always",
        warnOnSpreadAttributes: true,
        forms: true,
      }],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    // public/ holds static browser scripts (the Atelier pages, vendored Embla). .noxa/ is local design previews.
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts", "public/**", ".noxa/**"],
  },
];

export default config;
