"use client";

import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { loginRequest } from "@/lib/msal-config";

export function useAuth() {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  const account = instance.getActiveAccount() ?? accounts[0] ?? null;

  const login = () => instance.loginRedirect(loginRequest);

  const logout = () =>
    instance.logoutRedirect({ postLogoutRedirectUri: "/login" });

  const getAccessToken = async (): Promise<string> => {
    if (!account) throw new Error("No active account");
    try {
      const response = await instance.acquireTokenSilent({
        scopes: ["User.Read"],
        account,
      });
      return response.accessToken;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        await instance.acquireTokenRedirect({ scopes: ["User.Read"] });
      }
      throw error;
    }
  };

  return {
    isAuthenticated,
    account,
    login,
    logout,
    getAccessToken,
    userName: account?.name ?? null,
    userEmail: account?.username ?? null,
  };
}
