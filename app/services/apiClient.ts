// 创建一个通用的API客户端，包含token过期自动刷新机制
import { store } from '@/app/store';
import { refreshAuthToken, setAccessToken, logout } from '@/app/store/authSlice';

class ApiClient {
  private static instance: ApiClient;
  private refreshingPromise: Promise<boolean> | null = null;

  private constructor() {}

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  // 通用请求方法
  async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    
    // 获取当前的access token
    const state = store.getState();
    const accessToken = state.auth.accessToken;
    
    // 合并默认选项
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { 'x-access-token': accessToken } : {}),
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    };

    // 发起请求
    let response = await fetch(`${API_BASE_URL}${url}`, defaultOptions);
    let data = await response.json();

    // 检查是否是token过期的情况 (code 4011)
    if (data.code === 4011) {
      // Token过期，需要刷新
      console.log('Token过期，尝试刷新...');
      
      // 如果正在刷新，则等待刷新完成
      if (this.refreshingPromise) {
        const refreshSuccess = await this.refreshingPromise;
        if (!refreshSuccess) {
          throw new Error('TOKEN_REFRESH_FAILED');
        }
      } else {
        // 开始刷新token
        this.refreshingPromise = this.refreshToken();
        const refreshSuccess = await this.refreshingPromise;
        this.refreshingPromise = null;
        
        if (!refreshSuccess) {
          throw new Error('TOKEN_REFRESH_FAILED');
        }
      }

      // 使用新token重新发起请求
      response = await fetch(`${API_BASE_URL}${url}`, defaultOptions);
      data = await response.json();
    }

    return data;
  }

  // 刷新token的方法
  private async refreshToken(): Promise<boolean> {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    
    try {
      // 使用Redux store中的refreshAuthToken action
      const resultAction = await store.dispatch(refreshAuthToken());
      
      // 检查刷新结果
      if (refreshAuthToken.fulfilled.match(resultAction)) {
        // 刷新成功
        return true;
      } else {
        // 刷新失败，触发登出
        store.dispatch(logout());
        return false;
      }
    } catch (error) {
      console.error('刷新token失败:', error);
      // 刷新失败，触发登出
      store.dispatch(logout());
      return false;
    }
  }
}

export default ApiClient.getInstance();