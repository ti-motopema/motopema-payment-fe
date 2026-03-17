const DEFAULT_BACKEND_API_URL = "http://127.0.0.1:8000";

export function getBackendApiUrl() {
  return (process.env.BACKEND_API_URL || DEFAULT_BACKEND_API_URL).replace(/\/+$/, "");
}

export function getPaymentProviderCredentials() {
  const clientId = process.env.PAYMENT_PROVIDER_CLIENT_ID;
  const clientSecret = process.env.PAYMENT_PROVIDER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("As credenciais do provedor de pagamento nao foram configuradas.");
  }

  return {
    clientId,
    clientSecret,
  };
}

export function getPaymentProviderDistributorAffiliation() {
  const distributorAffiliation = process.env.PAYMENT_PROVIDER_DISTRIBUTOR_AFFILIATION?.trim();

  return distributorAffiliation || undefined;
}

export function getPaymentProviderThreeDSBillingDefaults() {
  return {
    address: process.env.PAYMENT_PROVIDER_3DS_BILLING_ADDRESS?.trim() || "Endereco nao informado",
    city: process.env.PAYMENT_PROVIDER_3DS_BILLING_CITY?.trim() || "Sao Paulo",
    postalcode: process.env.PAYMENT_PROVIDER_3DS_BILLING_POSTALCODE?.trim() || "00000000",
    state: process.env.PAYMENT_PROVIDER_3DS_BILLING_STATE?.trim() || "SP",
    country: process.env.PAYMENT_PROVIDER_3DS_BILLING_COUNTRY?.trim() || "BRA",
  };
}
