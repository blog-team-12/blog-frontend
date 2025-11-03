'use client';

import styles from './index.module.scss'
import { useState, useRef, useEffect } from 'react';
import { FaRegUser } from 'react-icons/fa';
import { BiEdit } from 'react-icons/bi';
import AuthModal from '@/app/Component/Auth/AuthModal';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/app/store';
import { logout } from '@/app/store/authSlice';
import { logout as apiLogout } from '@/app/services/api'; // 添加退出登录API

function Nav() {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showTopAlert, setShowTopAlert] = useState(false); // 顶部提示框状态
  const [topAlertMessage, setTopAlertMessage] = useState(''); // 顶部提示框消息
  const userIconRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLDivElement>(null);

  // 显示顶部提示框
  const showTopAlertMessage = (message: string) => {
    setTopAlertMessage(message);
    setShowTopAlert(true);
    // 2秒后自动隐藏
    setTimeout(() => {
      setShowTopAlert(false);
    }, 2000);
  };

  // 点击外部关闭提示框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        promptRef.current &&
        !promptRef.current.contains(event.target as Node) &&
        userIconRef.current &&
        !userIconRef.current.contains(event.target as Node)
      ) {
        setShowPrompt(false);
      }
    };

    if (showPrompt) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPrompt]);

  const handleUserIconClick = () => {
    setShowPrompt(!showPrompt);
  };

  const handleLoginClick = () => {
    setShowPrompt(false);
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const handleRegisterClick = () => {
    setShowPrompt(false);
    setAuthMode('register');
    setShowAuthModal(true);
  };

  // 处理退出登录
  const handleLogout = async () => {
    try {
      // 调用退出登录API
      const result = await apiLogout();
      if (result.code === 2000) {
        // 清除Redux中的用户数据
        dispatch(logout());
        setShowPrompt(false);
        showTopAlertMessage('已成功退出登录');
      } else {
        showTopAlertMessage(result.messages || '退出登录失败');
      }
    } catch (error) {
      console.error('退出登录异常:', error);
      showTopAlertMessage('退出登录失败，请稍后重试');
    }
  };

  return (
    <nav className={styles.navContainer}>
      {/* 顶部提示框 */}
      {showTopAlert && (
        <div className={styles.topAlert}>
          {topAlertMessage}
        </div>
      )}

      <div className={styles.nav}>
        <ul className={styles.navLeftList}>
          <li>
            <a href="/">首页</a>
          </li>
          <li>
            <a href="/blog">关于</a>
          </li>
          <li>
            <span>搜索</span>
          </li>
        </ul>
        <ul className={styles.navRightList}>
          <li>
            <div style={{ position: 'relative' }}>
              {/* 用户图标 */}
              <div
                ref={userIconRef}
                onClick={handleUserIconClick}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                {user && user.avatar ? (
                  <img
                    src={user.avatar}
                    alt="用户头像"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <FaRegUser size={24} />
                )}
                {user && (
                  <span style={{ marginLeft: '8px', fontSize: '14px' }}>
                    {user.username || user.email}
                  </span>
                )}
              </div>

              {/* 下拉提示框 */}
              {showPrompt && (
                <div
                  ref={promptRef}
                  className={styles.userPrompt}
                >
                  {user ? (
                    // 已登录状态
                    <>
                      <div className={styles.userHeader}>
                        <h3>欢迎回来，{user.username}!</h3>
                        <div className={styles.userDetails}>
                          {user.avatar && (
                            <img
                              src={user.avatar}
                              alt="用户头像"
                              className={styles.userAvatar}
                            />
                          )}
                          <p> {user.username}</p>
                        </div>
                        <p><strong>UUID:</strong> {user.uuid}</p>
                      </div>

                      <div className={styles.userActions}>
                        <p>签名: {user.signature || '暂无签名'}</p>
                        <button
                          onClick={() => {
                            setShowPrompt(false);
                            // 可以添加跳转到个人中心的逻辑
                          }}
                          className={styles.actionButton}
                        >
                          个人中心
                        </button>
                        <button
                          onClick={handleLogout}
                          className={styles.logoutButton}
                        >
                          退出登录
                        </button>
                      </div>
                    </>
                  ) : (
                    // 未登录状态
                    <>
                      <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '16px' }}>请登录以获取完整功能</h3>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                        <button
                          onClick={handleLoginClick}
                          style={{
                            padding: '10px',
                            // backgroundColor: '#4a90e2',
                            // color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                          }}
                        >
                          <FaRegUser size={36} /> 登录
                        </button>
                        <div
                          onClick={handleRegisterClick}
                          style={{

                            padding: '10px',
                            // backgroundColor: '#5cb85c',
                            // color: 'white',
                            flexDirection: 'column',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                          }}
                        >
                          <BiEdit size={36} /> 注册
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </li>
        </ul>
      </div>

      {/* 登录/注册模态框 */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={authMode}
          onLoginSuccess={showTopAlertMessage}
        />
      )}
    </nav>
  );
}

export default Nav;
