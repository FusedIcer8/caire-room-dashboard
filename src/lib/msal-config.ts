import { Configuration, LogLevel } from "@azure/msal-browser";

export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID ?? "",
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_TENANT_ID}`,
    redirectUri: typeof window !== "undefined" ? window.location.origin : "",
    postLogoutRedirectUri: "/login",
  },
  cache: {
    cacheLocation: "sessionStorage",
  },
  system: {
    loggerOptions: {
      loggerCallback: (_level, message, containsPii) => {
        if (containsPii) return;
        if (_level === LogLevel.Error) console.error("[MSAL]", message);
      },
      logLevel: LogLevel.Warning,
    },
  },
};

export const loginRequest = {
  scopes: ["User.Read"],
};

export const graphScopes = {
  scopes: ["User.Read"],
};
