type HttpRequestInit = RequestInit & {
  params?: Record<string, string>;
};

type HttpUploadRequestInit = HttpRequestInit & {
  name?: string;
};

interface HttpResponse<T = unknown> extends Response {
  json(): Promise<T>;
}

type HttpProvider = HttpProviderImplementation & {
  <T>(path: RequestInfo, options?: HttpRequestInit): Promise<HttpResponse<T>>;
  config: HttpProviderConfig;
};

type HttpProviderConfig = {
  baseUrl: string;
  authorization?: string;
};

type HttpProviderImplementation = {
  /** Builds the URI for an HTTP request. */
  uri: (path: RequestInfo, params?: Record<string, string>) => string;
  /**  Performs a POST request to the server, sending data as JSON body. */
  post: <T, D = unknown>(
    path: RequestInfo,
    data?: D,
    options?: HttpRequestInit,
  ) => Promise<HttpResponse<T>>;
  upload: <T>(
    path: RequestInfo,
    file: Blob,
    options?: HttpUploadRequestInit,
  ) => Promise<HttpResponse<T>>;
};

export const getDefaultHttpConfig = (): HttpProviderConfig => ({
  baseUrl: 'http://127.0.0.1:3333',
});

const httpImpl: HttpProviderImplementation = {
  uri(path, params) {
    const endpoint = http.config.baseUrl + path;
    return params ? `${endpoint}?${new URLSearchParams(params)}` : endpoint;
  },
  post: (path, data, options) =>
    fetchWrapper(path, {
      ...options,
      method: 'POST',
      body: data && JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    }),
  upload(path, file, {name = 'file', ...options} = {name: 'file'}) {
    const data = new FormData();
    data.append(name, file);

    return fetchWrapper(path, {
      ...options,
      method: 'POST',
      body: data,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

const fetchWrapper = (path: RequestInfo, options?: HttpRequestInit) =>
  fetch(httpImpl.uri(path, options?.params), {
    ...options,
    headers: {
      // Authorization: `Bearer ${http.config.authorization}`,
      Accept: 'application/json',
      ...options?.headers,
    },
  });

export const http: HttpProvider = Object.assign(fetchWrapper, {
  config: getDefaultHttpConfig(),
  ...httpImpl,
});
