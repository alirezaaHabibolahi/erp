import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ConfigService } from '@nestjs/config';

export interface ApiRequestOptions extends AxiosRequestConfig {
    /**
     * Optional message to override success message
     */
    successMessage?: string;

    /**
     * If true, automatically format body as FormData
     */
    useFormData?: boolean;

    /**
     * Optional Bearer token (if not provided, no Authorization header will be set)
     */
    token?: string;

    /**
     * Optional custom headers
     */
    headers?: Record<string, string>;
}

@Injectable()
export class ApiRestService {
    private readonly axiosInstance: AxiosInstance;
    private readonly logger = new Logger(ApiRestService.name);

    constructor(private readonly configService: ConfigService) {
        this.axiosInstance = axios.create({
            timeout: 15000,
            headers: {
                Accept: 'application/json',
            },
        });

        this.initializeInterceptors();
    }

    private initializeInterceptors() {
        this.axiosInstance.interceptors.request.use(
            (config) => {
                this.logger.debug(
                    `➡️ [${config.method?.toUpperCase()}] ${config.baseURL}${config.url}`,
                );
                return config;
            },
            (error) => {
                this.logger.error('Request Error:', error.message);
                return Promise.reject(error);
            },
        );

        this.axiosInstance.interceptors.response.use(
            (response) => {
                this.logger.debug(
                    `✅ [${response.status}] ${response.config.url}`,
                );
                return response;
            },
            (error) => {
                const { response } = error;
                if (response) {
                    this.logger.error(
                        `❌ [${response.status}] ${response.config?.url} - ${
                            response.data?.message || error.message
                        }`,
                    );
                } else {
                    this.logger.error(`❌ Network/Error: ${error.message}`);
                }
                return Promise.reject(this.formatError(error));
            },
        );
    }

    // ✅ Central error formatter
    private formatError(error: any) {
        const message =
            error.response?.data?.message ||
            error.message ||
            'Unknown error occurred';

        return {
            data: null,
            message,
            error: true,
            status: error.response?.status || 500,
        };
    }

    // ✅ Central success formatter
    private formatResponse<T>(data: T, message = 'Success') {
        return {
            data,
            message,
            error: false,
        };
    }

    // -------------------------------------------------------
    // 🧠 Generic request method (with per-call options)
    // -------------------------------------------------------
    private async request<T>(
        method: string,
        url: string,
        options: ApiRequestOptions = {},
    ): Promise<{ data: T | null; message: string; error: boolean }> {
        try {
            let config: AxiosRequestConfig = {
                method,
                url,
                ...options,
                headers: {
                    ...(options.headers || {}),
                },
            };

            // 🔐 Handle optional token
            if (options.token) {
                // @ts-ignore
                config.headers['Authorization'] = `Bearer ${options.token}`;
            }

            // 🧾 Handle FormData if requested
            if (options.useFormData && options.data && !(options.data instanceof FormData)) {
                const formData = new FormData();
                Object.entries(options.data).forEach(([key, value]) =>
                    formData.append(key, value as any),
                );
                config.data = formData;
                // @ts-ignore
                config.headers['Content-Type'] = 'multipart/form-data';
            }

            const response: AxiosResponse<T> = await this.axiosInstance.request(config);
            return this.formatResponse(
                response.data,
                options.successMessage || `Request to ${url} successful`,
            );
        } catch (error) {
            return this.formatError(error);
        }
    }

    // -------------------------------------------------------
    // 🧱 HTTP methods
    // -------------------------------------------------------
    async get<T = any>(url: string, options?: ApiRequestOptions) {
        return this.request<T>('GET', url, options);
    }

    async post<T = any>(url: string, options?: ApiRequestOptions) {
        return this.request<T>('POST', url, options);
    }

    async put<T = any>(url: string, options?: ApiRequestOptions) {
        return this.request<T>('PUT', url, options);
    }

    async patch<T = any>(url: string, options?: ApiRequestOptions) {
        return this.request<T>('PATCH', url, options);
    }

    async delete<T = any>(url: string, options?: ApiRequestOptions) {
        return this.request<T>('DELETE', url, options);
    }
}
