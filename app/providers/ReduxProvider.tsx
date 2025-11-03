"use client";

import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/app/store';
import { initFromLocalStorage } from '@/app/store/authSlice';

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 在客户端初始化时从localStorage恢复状态
    store.dispatch(initFromLocalStorage());
  }, []);

  return <Provider store={store}>{children}</Provider>;
}