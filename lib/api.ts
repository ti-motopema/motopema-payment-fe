import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 15000,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError<{ error?: string; message?: string }>) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.error ??
      error.response?.data?.message ??
      error.message;

    if (status === 401) {
      console.warn("[api] Não autenticado:", message);
    } else if (status === 403) {
      console.warn("[api] Acesso negado:", message);
    } else if (status === 404) {
      console.warn("[api] Recurso não encontrado:", message);
    } else if (status && status >= 500) {
      console.error("[api] Erro no servidor:", message);
    }

    return Promise.reject(error);
  }
);

export function get<T>(url: string, config?: AxiosRequestConfig) {
  return api.get<T>(url, config).then((r) => r.data);
}

export function post<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
  return api.post<T>(url, data, config).then((r) => r.data);
}

export function put<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
  return api.put<T>(url, data, config).then((r) => r.data);
}

export function patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
  return api.patch<T>(url, data, config).then((r) => r.data);
}

export function del<T>(url: string, config?: AxiosRequestConfig) {
  return api.delete<T>(url, config).then((r) => r.data);
}
