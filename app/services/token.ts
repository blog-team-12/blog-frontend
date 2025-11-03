// 刷新访问token
export const refreshAccessToken = async () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  
  try {
    const response = await fetch(`${API_BASE_URL}/refreshToken`, {
      method: 'GET',
      credentials: 'include', // 包含cookie，用于发送httpOnly cookie中的刷新token
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