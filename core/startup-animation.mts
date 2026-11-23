import path from "node:path";
import { boundedText, ContractError, parseThemeRef } from "../contracts/manager.mjs";
import type { StartupAnimationSettings } from "../contracts/manager.mjs";
import { jsonObject, optionalBytes } from "./local-files.mjs";
import { durableJson, privateDirectory } from "./write-files.mjs";

const settingsFile = (state: string) => path.join(state, "startup-animation.json");
const defaultSettings = (enabled = true): StartupAnimationSettings => ({
  enabled, theme: { source: "preset", id: "preset-dragon-startup" }, themeName: "龙娘启动动画",
});
export async function startupAnimationSettings(state: string): Promise<StartupAnimationSettings> {
  const bytes = await optionalBytes(settingsFile(state), state, 4096);
  if (!bytes) return defaultSettings();
  const value = jsonObject(bytes);
  if (value.schemaVersion !== 1 || typeof value.enabled !== "boolean" ||
      (value.theme !== null && !boundedText(value.themeName, 80))) throw new ContractError("THEME_INVALID", "Invalid startup animation settings.");
  if (value.theme === null) return defaultSettings(value.enabled);
  return { enabled: value.enabled, theme: parseThemeRef(value.theme), themeName: value.themeName as string };
}
export async function saveStartupAnimationSettings(state: string, settings: StartupAnimationSettings): Promise<StartupAnimationSettings> {
  const value = settings.theme === null ? defaultSettings(settings.enabled) : settings;
  await privateDirectory(state);
  await durableJson(settingsFile(state), state, { schemaVersion: 1, ...value });
  return value;
}
