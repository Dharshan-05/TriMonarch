import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { API_CONFIG } from './config';
import { ApiError, ApiErrorCategory } from './errors';
import { ApiResponse } from '@/types/api';
import { tokenManager } from '@/lib/auth/token-manager';

class HttpClient {
  private instance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
  }> = [];

  constructor() {
    this.instance = axios.create({
      baseURL: API_CONFIG.baseURL,
      timeout: API_CONFIG.timeout,
      headers: API_CONFIG.headers,
    });

    this.setupInterceptors();
  }

  private processQueue(error: unknown, token: string | null = null): void {
    this.failedQueue.forEach((promise) => {
      if (error) {
        promise.reject(error);
      } else if (token) {
        promise.resolve(token);
      }
    });
    this.failedQueue = [];
  }

  private setupInterceptors(): void {
    // Request interceptor: Attach JWT Bearer Token if available
    this.instance.interceptors.request.use(
      (config) => {
        const token = tokenManager.getAccessToken();
        if (token && !config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor: Automatic 401 token refresh & request retry
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError<ApiResponse<unknown>>) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest._retry &&
          !originalRequest.url?.includes('/auth/login') &&
          !originalRequest.url?.includes('/auth/refresh')
        ) {
          const refreshToken = tokenManager.getRefreshToken();
          if (!refreshToken) {
            tokenManager.clearTokens();
            return Promise.reject(this.handleAxiosError(error));
          }

          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                return this.instance(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshResponse = await axios.post<ApiResponse<{ accessToken: string; refreshToken?: string }>>(
              `${API_CONFIG.baseURL}/auth/refresh`,
              { refreshToken },
              { headers: API_CONFIG.headers },
            );

            const data = refreshResponse.data?.data;
            if (data?.accessToken) {
              tokenManager.setAccessToken(data.accessToken);
              if (data.refreshToken) {
                tokenManager.setRefreshToken(data.refreshToken);
              }

              this.processQueue(null, data.accessToken);
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
              }
              return this.instance(originalRequest);
            }
          } catch (refreshErr) {
            this.processQueue(refreshErr, null);
            tokenManager.clearTokens();
            return Promise.reject(this.handleAxiosError(error));
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(this.handleAxiosError(error));
      },
    );
  }

  private mapStatusToCategory(status: number): ApiErrorCategory {
    if (status === 401) return 'UNAUTHENTICATED';
    if (status === 403) return 'UNAUTHORIZED';
    if (status === 404) return 'NOT_FOUND';
    if (status === 409) return 'CONFLICT';
    if (status === 422 || status === 400) return 'VALIDATION_ERROR';
    if (status === 429) return 'RATE_LIMIT_EXCEEDED';
    if (status >= 500) return 'SERVER_ERROR';
    return 'UNKNOWN_ERROR';
  }

  public handleAxiosError(error: AxiosError<ApiResponse<unknown>>): ApiError {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return new ApiError(
        'The request timed out. Please check your network connection and try again.',
        'TIMEOUT_ERROR',
        'TIMEOUT_ERROR',
        408,
      );
    }

    if (axios.isCancel(error)) {
      return new ApiError(
        'Request was cancelled by the client.',
        'REQUEST_CANCELLED',
        'NETWORK_ERROR',
        0,
      );
    }

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      const category = this.mapStatusToCategory(status);
      const requestId =
        (error.response.headers['x-request-id'] as string) ||
        data?.meta?.requestId;

      if (data && data.error) {
        return new ApiError(
          data.error.message || 'An error occurred on the server.',
          data.error.code || `HTTP_${status}`,
          category,
          status,
          data.error.details,
          requestId,
        );
      }

      return new ApiError(
        error.message || `Server returned status code ${status}`,
        `HTTP_${status}`,
        category,
        status,
        undefined,
        requestId,
      );
    } else if (error.request) {
      return new ApiError(
        'Network error: Server is unreachable. Please verify your connection.',
        'NETWORK_ERROR',
        'NETWORK_ERROR',
        0,
      );
    } else {
      return new ApiError(
        error.message || 'An unexpected request error occurred.',
        'CLIENT_REQUEST_ERROR',
        'UNKNOWN_ERROR',
        0,
      );
    }
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<ApiResponse<T>>(url, config);
    return this.extractData(response);
  }

  public async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.instance.post<ApiResponse<T>>(url, data, config);
    return this.extractData(response);
  }

  public async put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.instance.put<ApiResponse<T>>(url, data, config);
    return this.extractData(response);
  }

  public async patch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.instance.patch<ApiResponse<T>>(url, data, config);
    return this.extractData(response);
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<ApiResponse<T>>(url, config);
    return this.extractData(response);
  }

  private extractData<T>(response: AxiosResponse<ApiResponse<T>>): T {
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return (response.data as ApiResponse<T>).data as T;
    }
    return response.data as unknown as T;
  }

  public getAxiosInstance(): AxiosInstance {
    return this.instance;
  }
}

export const apiClient = new HttpClient();
