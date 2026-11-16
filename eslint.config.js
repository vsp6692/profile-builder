export default [
  {
    files: ["**/*.js", "**/*.mjs"],
    rules: {
      "no-unused-vars": ["error", { args: "none", caughtErrors: "none" }],
      "no-constant-condition": "error",
      "no-unreachable": "error",
    },
  },
];
