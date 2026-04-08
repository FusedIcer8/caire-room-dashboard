import { Client } from "@microsoft/microsoft-graph-client";
import { getAppAccessToken } from "./msal-server";

export async function getGraphClient(): Promise<Client> {
  const accessToken = await getAppAccessToken();
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
}
