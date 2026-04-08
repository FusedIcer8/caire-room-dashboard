import {
  ConfidentialClientApplication,
  type Configuration,
} from "@azure/msal-node";

const msalNodeConfig: Configuration = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID ?? "",
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
    clientSecret: process.env.AZURE_CLIENT_SECRET ?? "",
  },
};

let ccaInstance: ConfidentialClientApplication | null = null;

function getCca(): ConfidentialClientApplication {
  if (!ccaInstance) {
    ccaInstance = new ConfidentialClientApplication(msalNodeConfig);
  }
  return ccaInstance;
}

export async function getAppAccessToken(): Promise<string> {
  const cca = getCca();
  const result = await cca.acquireTokenByClientCredential({
    scopes: ["https://graph.microsoft.com/.default"],
  });
  if (!result) {
    throw new Error("Failed to acquire application access token");
  }
  return result.accessToken;
}
