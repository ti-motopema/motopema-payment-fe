import { NextResponse } from "next/server";
import { getBackendApiUrl } from "@/lib/backend/config";

type BackendRequestOptions = RequestInit & {
  path: string;
};

export async function backendRequest({ path, headers, ...init }: BackendRequestOptions) {
  return fetch(`${getBackendApiUrl()}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...headers,
    },
    cache: "no-store",
  });
}

export async function proxyBackendJsonResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  }

  const text = await response.text();
  return new NextResponse(text, {
    status: response.status,
    headers: contentType ? { "content-type": contentType } : undefined,
  });
}
