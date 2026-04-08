import { NextRequest, NextResponse } from "next/server";

export interface AuthUser {
  readonly entraId: string;
  readonly name: string;
  readonly email: string;
  readonly groups: readonly string[];
}

interface TokenPayload {
  oid?: string;
  name?: string;
  preferred_username?: string;
  groups?: string[];
}

export function extractUserFromToken(payload: TokenPayload): AuthUser | null {
  if (!payload.oid || !payload.preferred_username) {
    return null;
  }
  return {
    entraId: payload.oid,
    name: payload.name ?? "Unknown",
    email: payload.preferred_username,
    groups: payload.groups ?? [],
  };
}

export function isAuthorizedGroup(
  userGroups: readonly string[],
  allowedGroupId: string,
): boolean {
  return userGroups.includes(allowedGroupId);
}

export function unauthorizedResponse(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function parseAuthHeader(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7);
}
