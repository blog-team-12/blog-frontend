// API服务封装
// 注意：在代理配置下，我们不再需要完整的API_BASE_URL，只需要相对路径
import ApiClient from '@/app/services/apiClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// 获取验证码
export const getCaptcha = async (): Promise<{ captcha_id: string; pic_path: string } | null> => {
  try {
    const result = await ApiClient.request<{ code: number; messages: string; data: { captcha_id: string; pic_path: string } }>(`/base/captcha`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (result.code === 2000) {
      return result.data;
    } else {
      console.error('获取验证码失败:', result.messages);
      return null;
    }
  } catch (error) {
    console.error('获取验证码异常:', error);
    return null;
  }
};

// 用户登录
export const login = async (email: string, password: string, captcha: string, captcha_id: string) => {
  try {
    const result = await ApiClient.request<{ code: number; messages: string; data: any }>('/user/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        captcha,
        captcha_id
      }),
    });
    return result;
  } catch (error) {
    console.error('登录异常:', error);
    throw error;
  }
};

// 发送邮箱验证码
export const sendEmailVerificationCode = async (email: string, captcha: string, captcha_id: string) => {
  try {
    const result = await ApiClient.request<{ code: number; messages: string; data: any }>('/base/sendEmailVerificationCode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        captcha,
        captcha_id
      }),
    });
    return result;
  } catch (error) {
    console.error('发送邮箱验证码异常:', error);
    throw error;
  }
};

// 用户注册
export const register = async (username: string, password: string, email: string, verification_code: string) => {
  try {
    const result = await ApiClient.request<{ code: number; messages: string; data: any }>('/user/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
        email,
        verification_code
      }),
    });
    return result;
  } catch (error) {
    console.error('注册异常:', error);
    throw error;
  }
};

// 刷新token
export const refreshToken = async () => {
  try {
    const result = await ApiClient.request<{ code: number; messages: string; data: any }>('/refreshToken', {
      method: 'GET',
    });
    return result;
  } catch (error) {
    console.error('刷新token异常:', error);
    throw error;
  }
};

// 用户退出登录
export const logout = async () => {
  try {
    const result = await ApiClient.request<{ code: number; messages: string; data: any }>('/user/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return result;
  } catch (error) {
    console.error('退出登录异常:', error);
    throw error;
  }
};

// 创建一个通用的API请求函数，包含token过期处理
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  // 合并默认选项
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // 使用ApiClient发起请求，它会自动处理token过期的情况
  const data = await ApiClient.request(url, defaultOptions);
  
  return {
    data
  };
};