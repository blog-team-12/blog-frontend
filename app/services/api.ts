// API服务封装
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// 获取验证码
export const getCaptcha = async (): Promise<{ captcha_id: string; pic_path: string } | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/base/captcha`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // 包含cookie
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
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
    const response = await fetch(`${API_BASE_URL}/user/login`, {
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
      credentials: 'include', // 包含cookie
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('登录异常:', error);
    throw error;
  }
};

// 发送邮箱验证码
export const sendEmailVerificationCode = async (email: string, captcha: string, captcha_id: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/base/sendEmailVerificationCode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        captcha,
        captcha_id
      }),
      credentials: 'include', // 包含cookie
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('发送邮箱验证码异常:', error);
    throw error;
  }
};

// 用户注册
export const register = async (username: string, password: string, email: string, verification_code: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/register`, {
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
      credentials: 'include', // 包含cookie
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('注册异常:', error);
    throw error;
  }
};

// 刷新token
export const refreshToken = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/refreshToken`, {
      method: 'GET',
      credentials: 'include', // 包含cookie
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('刷新token异常:', error);
    throw error;
  }
};

// 用户退出登录
export const logout = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // 包含cookie
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
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
    credentials: 'include', // 包含cookie
    ...options,
  };

  // 发起请求
  let response = await fetch(`${API_BASE_URL}${url}`, defaultOptions);

  // 检查是否是token过期的情况 (code 4011)
  const data = await response.json();
  
  // 重新解析JSON，因为我们已经读取了一次body
  if (data.code === 4011) {
    // Token过期，需要刷新
    console.log('Token过期，尝试刷新...');
    // 注意：这里需要访问Redux store来调用refreshAuthToken
    // 由于我们无法直接访问store，这里只是一个示例
    // 在实际使用中，应该在调用apiRequest的地方处理token刷新
    
    // 抛出一个特殊的错误，让调用者知道需要刷新token
    throw new Error('TOKEN_EXPIRED');
  }

  return {
    response,
    data
  };
};