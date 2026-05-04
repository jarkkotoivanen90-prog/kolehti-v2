import { fetchGameConfig } from "./gameConfig";

export async function startMockPayment(type = "daily_entry") {
  const config = await fetchGameConfig();

  if (!config.mock_payments_enabled) {
    return { success: false };
  }

  return {
    success: true,
    type,
    amount: type === "daily_entry" ? 5 : 2,
    mock: true,
    timestamp: Date.now(),
  };
}

export async function startCheckout(type = "daily_entry") {
  const config = await fetchGameConfig();

  if (!config.payments_enabled) {
    return startMockPayment(type);
  }

  return {
    success: true,
    type,
    live: false,
  };
}
