import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { User } from '@/types/user';

// 定义状态类型
interface AuthState {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
}

// 初始状态
const initialState: AuthState = {
  user: null,
  accessToken: null,
  loading: false,
  error: null,
};

// 异步action：刷新token
export const refreshAuthToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const response = await fetch(`${API_BASE_URL}/refreshToken`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.code === 2000) {
        // 刷新成功，返回新的访问token
        return result.data.access_token;
      } else {
        // 刷新失败
        return rejectWithValue(result.messages || '刷新token失败');
      }
    } catch (error) {
      return rejectWithValue('网络错误或服务器异常');
    }
  }
);

// 创建auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // 登录
    login: (state, action) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.error = null;
      // 保存到localStorage
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      localStorage.setItem('access_token', action.payload.accessToken);
    },
    // 登出
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.error = null;
      // 清除localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('access_token');
    },
    // 设置访问token
    setAccessToken: (state, action) => {
      state.accessToken = action.payload;
      if (action.payload) {
        localStorage.setItem('access_token', action.payload);
      } else {
        localStorage.removeItem('access_token');
      }
    },
    // 从localStorage初始化状态
    initFromLocalStorage: (state) => {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('access_token');
      if (storedUser && storedToken) {
        state.user = JSON.parse(storedUser);
        state.accessToken = storedToken;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // 刷新token pending
      .addCase(refreshAuthToken.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // 刷新token fulfilled
      .addCase(refreshAuthToken.fulfilled, (state, action) => {
        state.loading = false;
        state.accessToken = action.payload;
        localStorage.setItem('access_token', action.payload);
      })
      // 创刷新token rejected
      .addCase(refreshAuthToken.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || '刷新token失败';
        // 刷新失败时登出
        state.user = null;
        state.accessToken = null;
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
      });
  },
});

// 导出action creators
export const { login, logout, setAccessToken, initFromLocalStorage } = authSlice.actions;

// 导出selectors
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectAccessToken = (state: { auth: AuthState }) => state.auth.accessToken;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.loading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;

export default authSlice.reducer;