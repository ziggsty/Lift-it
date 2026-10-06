export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
  [key: string]: any;
}

export interface ApiCallLog {
  id: string;
  timestamp: string;
  method: string;
  endpoint: string;
  status: number;
  durationMs: number;
  requestHeaders: Record<string, string>;
  requestBody?: any;
  responseBody: any;
  success: boolean;
}

class ApiService {
  private token: string | null = null;
  private callLogs: ApiCallLog[] = [];
  private logListeners: ((logs: ApiCallLog[]) => void)[] = [];

  constructor() {
    // Attempt to recover token from localStorage
    const savedToken = localStorage.getItem('lift_it_token');
    if (savedToken) {
      this.token = savedToken;
    }
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('lift_it_token', token);
    } else {
      localStorage.removeItem('lift_it_token');
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  public getCallLogs(): ApiCallLog[] {
    return [...this.callLogs];
  }

  public onLogUpdate(listener: (logs: ApiCallLog[]) => void) {
    this.logListeners.push(listener);
    return () => {
      this.logListeners = this.logListeners.filter((l) => l !== listener);
    };
  }

  private notifyLogListeners() {
    this.logListeners.forEach((l) => l([...this.callLogs]));
  }

  public clearLogs() {
    this.callLogs = [];
    this.notifyLogListeners();
  }

  public async request<T = any>(
    method: string,
    endpoint: string,
    body?: any,
    customHeaders?: Record<string, string>
  ): Promise<{ response: ApiResponse<T>; status: number }> {
    const startTime = performance.now();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (this.token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    let responseData: any;
    let status = 0;

    try {
      const res = await fetch(endpoint, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      status = res.status;
      try {
        responseData = await res.json();
      } catch {
        responseData = { error: 'Non-JSON response received' };
      }
    } catch (err: any) {
      status = 0;
      responseData = { success: false, error: err.message || 'Network request failed' };
    }

    const durationMs = Math.round(performance.now() - startTime);

    const logEntry: ApiCallLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString(),
      method,
      endpoint,
      status,
      durationMs,
      requestHeaders: headers,
      requestBody: body,
      responseBody: responseData,
      success: status >= 200 && status < 300,
    };

    this.callLogs.unshift(logEntry);
    if (this.callLogs.length > 50) this.callLogs.pop();
    this.notifyLogListeners();

    return { response: responseData, status };
  }
}

export const api = new ApiService();
