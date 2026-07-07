import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageJsonPath = resolve(rootDir, "package.json");
const command = process.argv[2];
const extraArgs = process.argv.slice(3);

await main().catch(handleFatalError);

async function main() {
  switch (command) {
    case "dev":
      await runNext("dev", extraArgs);
      return;
    case "build":
      await runNext("build", extraArgs);
      return;
    case "start":
      await runNext("start", extraArgs);
      return;
    case "lint":
      await runLint();
      return;
    case "test":
      await runTests(extraArgs);
      return;
    default:
      console.error(
        `[tasks] unknown command: ${command ?? "(missing)"}\n` +
          "usage: node scripts/tasks.mjs <dev|build|start|lint|test>",
      );
      process.exit(1);
  }
}

async function runNext(nextCommand, nextArgs) {
  await runNodeStep(
    `next-${nextCommand}`,
    "node_modules/next/dist/bin/next",
    [nextCommand, ...nextArgs],
    ["--disable-warning=DEP0205"],
  );
}

async function runLint() {
  await runNodeStep("oxlint", "node_modules/oxlint/dist/cli.js", [
    "--fix",
    ".",
  ]);
  await runNodeStep("oxfmt", "node_modules/oxfmt/dist/cli.js", ["."]);
  await formatPackageJson();
}

async function runTests(testArgs) {
  await runNodeStep("vitest", "node_modules/vitest/vitest.mjs", [
    "run",
    ...testArgs,
  ]);
}

function runNodeStep(label, scriptPath, args = [], nodeArgs = []) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(
      process.execPath,
      [...nodeArgs, resolve(rootDir, scriptPath), ...args],
      {
        cwd: rootDir,
        stdio: "inherit",
      },
    );

    child.once("error", (error) => {
      rejectPromise(
        new Error(`[tasks] failed to start ${label}`, { cause: error }),
      );
    });

    child.once("exit", (code, signal) => {
      if (signal) {
        rejectPromise(
          new Error(
            `[tasks] ${label} exited unexpectedly with signal ${signal}`,
          ),
        );
        return;
      }

      if (code !== 0) {
        rejectPromise(new Error(`[tasks] ${label} exited with code ${code}`));
        return;
      }

      resolvePromise();
    });
  });
}

async function formatPackageJson() {
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
  const formatted = `${formatJsonValue(packageJson)}\n`;
  await writeFile(packageJsonPath, formatted, "utf8");
}

function formatJsonValue(value, indentLevel = 0, currentKey = null) {
  if (Array.isArray(value)) {
    return formatJsonArray(value, indentLevel);
  }

  if (value && typeof value === "object") {
    return formatJsonObject(
      value,
      indentLevel,
      shouldAlignObjectKeys(currentKey),
    );
  }

  return JSON.stringify(value);
}

function formatJsonArray(items, indentLevel) {
  if (items.length === 0) {
    return "[]";
  }

  const indent = getIndent(indentLevel);
  const childIndent = getIndent(indentLevel + 1);
  const lines = items.map(
    (item) => `${childIndent}${formatJsonValue(item, indentLevel + 1)}`,
  );

  return `[\n${lines.join(",\n")}\n${indent}]`;
}

function formatJsonObject(objectValue, indentLevel, alignKeys) {
  const entries = Object.entries(objectValue);

  if (entries.length === 0) {
    return "{}";
  }

  const indent = getIndent(indentLevel);
  const childIndent = getIndent(indentLevel + 1);
  const serializedKeys = entries.map(([key]) => JSON.stringify(key));
  const keyWidth = alignKeys
    ? Math.max(...serializedKeys.map((serializedKey) => serializedKey.length))
    : 0;
  const lines = entries.map(([key, nestedValue], index) => {
    const serializedKey = serializedKeys[index];
    const paddedKey = alignKeys
      ? serializedKey.padEnd(keyWidth, " ")
      : serializedKey;

    return (
      `${childIndent}${paddedKey}${alignKeys ? " : " : ": "}` +
      formatJsonValue(nestedValue, indentLevel + 1, key)
    );
  });

  return `{\n${lines.join(",\n")}\n${indent}}`;
}

function shouldAlignObjectKeys(currentKey) {
  return (
    currentKey === "scripts" ||
    currentKey === "dependencies" ||
    currentKey === "devDependencies"
  );
}

function getIndent(indentLevel) {
  return "  ".repeat(indentLevel);
}

function handleFatalError(error) {
  console.error(error);
  process.exitCode = 1;
}
