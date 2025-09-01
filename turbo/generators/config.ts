import { execSync } from "node:child_process";
import type { PlopTypes } from "@turbo/gen";

interface PackageJson {
  name: string;
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  // React Package Generator
  plop.setGenerator("react-package", {
    description: "Generate a new React package with TypeScript",
    prompts: [
      {
        type: "input",
        name: "name",
        message:
          "What is the name of the package? (You can skip the `@charmlabs/` prefix)",
      },
      {
        type: "input",
        name: "description",
        message: "Package description:",
        default: "A React component library",
      },
      {
        type: "list",
        name: "styling",
        message: "What styling solution would you like to use?",
        choices: [
          { name: "Tailwind CSS", value: "tailwind" },
          { name: "CSS Modules", value: "css-modules" },
          { name: "None", value: "none" },
        ],
        default: "tailwind",
      },
      {
        type: "confirm",
        name: "includeStorybook",
        message: "Would you like to include Storybook?",
        default: false,
      },
      {
        type: "input",
        name: "deps",
        message:
          "Enter a space separated list of additional dependencies:",
        default: "",
      },
    ],
    actions: [
      // Sanitize package name
      (answers) => {
        if ("name" in answers && typeof answers.name === "string") {
          if (answers.name.startsWith("@charmlabs/")) {
            answers.name = answers.name.replace("@charmlabs/", "");
          }
        }
        return "Config sanitized";
      },
      // Add package.json
      {
        type: "add",
        path: "packages/{{ name }}/package.json",
        templateFile: "templates/react/package.json.hbs",
      },
      // Add tsconfig
      {
        type: "add",
        path: "packages/{{ name }}/tsconfig.json",
        templateFile: "templates/react/tsconfig.json.hbs",
      },
      // Add eslint config
      {
        type: "add",
        path: "packages/{{ name }}/eslint.config.js",
        templateFile: "templates/react/eslint.config.js.hbs",
      },
      // Add main index file
      {
        type: "add",
        path: "packages/{{ name }}/src/index.ts",
        templateFile: "templates/react/index.ts.hbs",
      },
      // Add example component
      {
        type: "add",
        path: "packages/{{ name }}/src/components/example.tsx",
        templateFile: "templates/react/example-component.tsx.hbs",
      },
      // Add Tailwind config if selected
      {
        type: "add",
        path: "packages/{{ name }}/tailwind.config.ts",
        templateFile: "templates/react/tailwind.config.ts.hbs",
        skip(answers) {
          return answers.styling !== "tailwind";
        },
      },
      // Add styles file if using Tailwind
      {
        type: "add",
        path: "packages/{{ name }}/src/styles.css",
        templateFile: "templates/react/styles.css.hbs",
        skip(answers) {
          return answers.styling !== "tailwind";
        },
      },
      // Add README
      {
        type: "add",
        path: "packages/{{ name }}/README.md",
        templateFile: "templates/react/README.md.hbs",
      },
      // Install additional dependencies
      {
        type: "modify",
        path: "packages/{{ name }}/package.json",
        async transform(content, answers) {
          if ("deps" in answers && typeof answers.deps === "string" && answers.deps) {
            const pkg = JSON.parse(content) as PackageJson;
            for (const dep of answers.deps.split(" ").filter(Boolean)) {
              try {
                const version = await fetch(
                  `https://registry.npmjs.org/-/package/${dep}/dist-tags`,
                )
                  .then((res) => res.json())
                  .then((json) => json.latest);
                if (!pkg.dependencies) pkg.dependencies = {};
                pkg.dependencies[dep] = `^${version}`;
              } catch (e) {
                console.warn(`Could not fetch version for ${dep}`);
              }
            }
            return JSON.stringify(pkg, null, 2);
          }
          return content;
        },
      },
      // Final installation and formatting
      async (answers) => {
        if ("name" in answers && typeof answers.name === "string") {
          execSync("pnpm i", { stdio: "inherit" });
          execSync(
            `pnpm prettier --write packages/${answers.name}/** --list-different`,
            { stdio: "inherit" }
          );
          return "React package scaffolded successfully";
        }
        return "Package not scaffolded";
      },
    ],
  });

  // TypeScript Package Generator
  plop.setGenerator("typescript-package", {
    description: "Generate a new vanilla TypeScript package",
    prompts: [
      {
        type: "input",
        name: "name",
        message:
          "What is the name of the package? (You can skip the `@charmlabs/` prefix)",
      },
      {
        type: "input",
        name: "description",
        message: "Package description:",
        default: "A TypeScript utility library",
      },
      {
        type: "list",
        name: "packageType",
        message: "What type of package is this?",
        choices: [
          { name: "Utility Library", value: "utility" },
          { name: "Service/API Client", value: "service" },
          { name: "Plugin/Extension", value: "plugin" },
          { name: "Configuration", value: "config" },
          { name: "Other", value: "other" },
        ],
        default: "utility",
      },
      {
        type: "confirm",
        name: "includeTests",
        message: "Would you like to include testing setup (Vitest)?",
        default: true,
      },
      {
        type: "input",
        name: "deps",
        message:
          "Enter a space separated list of additional dependencies:",
        default: "",
      },
    ],
    actions: [
      // Sanitize package name
      (answers) => {
        if ("name" in answers && typeof answers.name === "string") {
          if (answers.name.startsWith("@charmlabs/")) {
            answers.name = answers.name.replace("@charmlabs/", "");
          }
        }
        return "Config sanitized";
      },
      // Add package.json
      {
        type: "add",
        path: "packages/{{ name }}/package.json",
        templateFile: "templates/typescript/package.json.hbs",
      },
      // Add tsconfig
      {
        type: "add",
        path: "packages/{{ name }}/tsconfig.json",
        templateFile: "templates/typescript/tsconfig.json.hbs",
      },
      // Add eslint config
      {
        type: "add",
        path: "packages/{{ name }}/eslint.config.js",
        templateFile: "templates/typescript/eslint.config.js.hbs",
      },
      // Add main index file
      {
        type: "add",
        path: "packages/{{ name }}/src/index.ts",
        templateFile: "templates/typescript/index.ts.hbs",
      },
      // Add example module based on type
      {
        type: "add",
        path: "packages/{{ name }}/src/{{#if (eq packageType 'service')}}client{{else if (eq packageType 'plugin')}}plugin{{else}}example{{/if}}.ts",
        templateFile: "templates/typescript/example-module.ts.hbs",
      },
      // Add types file
      {
        type: "add",
        path: "packages/{{ name }}/src/types.ts",
        templateFile: "templates/typescript/types.ts.hbs",
      },
      // Add vitest config if tests are included
      {
        type: "add",
        path: "packages/{{ name }}/vitest.config.ts",
        templateFile: "templates/typescript/vitest.config.ts.hbs",
        skip(answers) {
          return !answers.includeTests;
        },
      },
      // Add test file if tests are included
      {
        type: "add",
        path: "packages/{{ name }}/src/__tests__/index.test.ts",
        templateFile: "templates/typescript/test.ts.hbs",
        skip(answers) {
          return !answers.includeTests;
        },
      },
      // Add README
      {
        type: "add",
        path: "packages/{{ name }}/README.md",
        templateFile: "templates/typescript/README.md.hbs",
      },
      // Install additional dependencies
      {
        type: "modify",
        path: "packages/{{ name }}/package.json",
        async transform(content, answers) {
          if ("deps" in answers && typeof answers.deps === "string" && answers.deps) {
            const pkg = JSON.parse(content) as PackageJson;
            for (const dep of answers.deps.split(" ").filter(Boolean)) {
              try {
                const version = await fetch(
                  `https://registry.npmjs.org/-/package/${dep}/dist-tags`,
                )
                  .then((res) => res.json())
                  .then((json) => json.latest);
                if (!pkg.dependencies) pkg.dependencies = {};
                pkg.dependencies[dep] = `^${version}`;
              } catch (e) {
                console.warn(`Could not fetch version for ${dep}`);
              }
            }
            return JSON.stringify(pkg, null, 2);
          }
          return content;
        },
      },
      // Final installation and formatting
      async (answers) => {
        if ("name" in answers && typeof answers.name === "string") {
          execSync("pnpm i", { stdio: "inherit" });
          execSync(
            `pnpm prettier --write packages/${answers.name}/** --list-different`,
            { stdio: "inherit" }
          );
          return "TypeScript package scaffolded successfully";
        }
        return "Package not scaffolded";
      },
    ],
  });

  // Keep the original init generator for backward compatibility
  plop.setGenerator("init", {
    description: "Generate a new package for the monorepo (legacy)",
    prompts: [
      {
        type: "input",
        name: "name",
        message:
          "What is the name of the package? (You can skip the `@charmlabs/` prefix)",
      },
      {
        type: "input",
        name: "deps",
        message:
          "Enter a space separated list of dependencies you would like to install",
      },
    ],
    actions: [
      (answers) => {
        if ("name" in answers && typeof answers.name === "string") {
          if (answers.name.startsWith("@charmlabs/")) {
            answers.name = answers.name.replace("@charmlabs/", "");
          }
        }
        return "Config sanitized";
      },
      {
        type: "add",
        path: "packages/{{ name }}/eslint.config.js",
        templateFile: "templates/eslint.config.js.hbs",
      },
      {
        type: "add",
        path: "packages/{{ name }}/package.json",
        templateFile: "templates/package.json.hbs",
      },
      {
        type: "add",
        path: "packages/{{ name }}/tsconfig.json",
        templateFile: "templates/tsconfig.json.hbs",
      },
      {
        type: "add",
        path: "packages/{{ name }}/src/index.ts",
        template: "export const name = '{{ name }}';",
      },
      {
        type: "modify",
        path: "packages/{{ name }}/package.json",
        async transform(content, answers) {
          if ("deps" in answers && typeof answers.deps === "string") {
            const pkg = JSON.parse(content) as PackageJson;
            for (const dep of answers.deps.split(" ").filter(Boolean)) {
              const version = await fetch(
                `https://registry.npmjs.org/-/package/${dep}/dist-tags`,
              )
                .then((res) => res.json())
                .then((json) => json.latest);
              if (!pkg.dependencies) pkg.dependencies = {};
              pkg.dependencies[dep] = `^${version}`;
            }
            return JSON.stringify(pkg, null, 2);
          }
          return content;
        },
      },
      async (answers) => {
        if ("name" in answers && typeof answers.name === "string") {
          execSync("pnpm i", { stdio: "inherit" });
          execSync(
            `pnpm prettier --write packages/${answers.name}/** --list-different`,
          );
          return "Package scaffolded";
        }
        return "Package not scaffolded";
      },
    ],
  });
}