import { supabase } from "./supabaseClient";

export const DEFAULT_GAME_CONFIG = {
  payments_enabled: false,
  auto_winner_enabled: false,
  stripe_live_enabled: false,
  mock_payments_enabled: true,
};

function parseBoolean(value, fallback = false) {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return fallback;
}

export async function fetchGameConfig() {
  try {
    const { data, error } = await supabase.from("app_config").select("key,value");
    if (error || !Array.isArray(data)) return DEFAULT_GAME_CONFIG;

    const raw = Object.fromEntries(data.map((item) => [item.key, item.value]));
    return {
      payments_enabled: parseBoolean(raw.payments_enabled, DEFAULT_GAME_CONFIG.payments_enabled),
      auto_winner_enabled: parseBoolean(raw.auto_winner_enabled, DEFAULT_GAME_CONFIG.auto_winner_enabled),
      stripe_live_enabled: parseBoolean(raw.stripe_live_enabled, DEFAULT_GAME_CONFIG.stripe_live_enabled),
      mock_payments_enabled: parseBoolean(raw.mock_payments_enabled, DEFAULT_GAME_CONFIG.mock_payments_enabled),
    };
  } catch {
    return DEFAULT_GAME_CONFIG;
  }
}

export async function isPaymentsEnabled() {
  const config = await fetchGameConfig();
  return Boolean(config.payments_enabled && config.stripe_live_enabled);
}
