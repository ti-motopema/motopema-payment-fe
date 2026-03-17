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
  const setCookie = response.headers.get("set-cookie");

  if (contentType.includes("application/json")) {
    const data = await response.json();
    const nextResponse = NextResponse.json(data, { status: response.status });

    if (setCookie) {
      nextResponse.headers.set("set-cookie", setCookie);
    }

    return nextResponse;
  }

  const text = await response.text();
  const nextResponse = new NextResponse(text, {
    status: response.status,
    headers: contentType ? { "content-type": contentType } : undefined,
  });

  if (setCookie) {
    nextResponse.headers.set("set-cookie", setCookie);
  }

  return nextResponse;
}
