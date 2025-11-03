"use client";

import React, { useState, useRef, useEffect } from 'react';
import styles from './AuthModal.module.scss';
import { FaUser, FaLock, FaEnvelope, FaRedo } from 'react-icons/fa';
// import { MdOutlineVerifiedUser } from 'react-icons/md';
import { MdOutlineVerifiedUser, MdVerified } from 'react-icons/md';
import { getCaptcha, login, sendEmailVerificationCode, register } from '@/app/services/api';
import { useDispatch, useSelector } from 'react-redux';
import { login as authLogin, logout, refreshAuthToken } from '@/app/store/authSlice';
import ApiClient from '@/app/services/apiClient';

interface CaptchaData {
  captcha_id: string;
  pic_path: string;
}

interface AuthModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialMode?: 'login' | 'register';
  onLoginSuccess?: (message: string) => void; // 登录成功回调
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen: externalIsOpen, onClose, initialMode = 'login', onLoginSuccess }) => {
  const dispatch = useDispatch();
  const { user, accessToken, loading, error } = useSelector((state: any) => state.auth);
  const [isOpen, setIsOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(initialMode === 'login'); // true为登录，false为注册
  const [captchaData, setCaptchaData] = useState<CaptchaData | null>(null);
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    captcha: ''
  });
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    captcha: '',
    emailCode: ''
  });
  const [registerCaptchaData, setRegisterCaptchaData] = useState<CaptchaData | null>(null);
  const [countdown, setCountdown] = useState(0); // 发送验证码倒计时
  const [registerSuccess, setRegisterSuccess] = useState(false); // 注册成功状态

  const modalRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭弹窗
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        if (onClose) {
          onClose();
        } else {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // 获取验证码
  const fetchCaptcha = async () => {
    try {
      const data = await getCaptcha();
      if (data) {
        setCaptchaData(data);
      } else {
        console.error('获取验证码失败: 返回数据为空');
      }
    } catch (error) {
      console.error('获取验证码异常:', error);
    }
  };

  // 注册成功提示2秒后自动消失
  useEffect(() => {
    if (registerSuccess) {
      const timer = setTimeout(() => {
        setRegisterSuccess(false);
        // 自动切换到登录模式
        setIsLogin(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [registerSuccess]);

  // 打开弹窗时获取验证码
  const handleOpen = () => {
    const newIsOpen = externalIsOpen !== undefined ? externalIsOpen : true;
    setIsOpen(newIsOpen);
    // 延迟一点时间再获取验证码，确保DOM已渲染
    setTimeout(() => {
      fetchCaptcha();
      fetchRegisterCaptcha();
    }, 100);
  };

  // 组件挂载时检查是否需要打开弹窗
  useEffect(() => {
    if (externalIsOpen !== undefined) {
      setIsOpen(externalIsOpen);
      if (externalIsOpen) {
        // 延迟一点时间再获取验证码，确保DOM已渲染
        setTimeout(() => {
          fetchCaptcha();
          fetchRegisterCaptcha();
        }, 100);
      }
    }
  }, [externalIsOpen]);

  // 刷新登录验证码
  const handleRefreshCaptcha = () => {
    fetchCaptcha();
  };

  // 获取注册验证码
  const fetchRegisterCaptcha = async () => {
    try {
      const data = await getCaptcha();
      if (data) {
        setRegisterCaptchaData(data);
      } else {
        console.error('获取注册验证码失败: 返回数据为空');
      }
    } catch (error) {
      console.error('获取注册验证码异常:', error);
    }
  };

  // 刷新注册验证码
  const handleRefreshRegisterCaptcha = () => {
    fetchRegisterCaptcha();
  };

  // 处理注册表单输入变化
  const handleRegisterInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 发送邮箱验证码
  const handleSendEmailCode = async () => {
    if (!registerForm.email) {
      alert('请输入邮箱');
      return;
    }
    
    if (!registerForm.captcha) {
      alert('请输入图片验证码');
      return;
    }
    
    if (!registerCaptchaData) {
      alert('请先获取图片验证码');
      return;
    }
    
    if (countdown > 0) return; // 倒计时未结束，不能重复发送
    
    try {
      const result = await sendEmailVerificationCode(
        registerForm.email,
        registerForm.captcha,
        registerCaptchaData.captcha_id
      );
      
      if (result.code === 2000) {
        alert('验证码已发送至您的邮箱，请查收');
        // 启动60秒倒计时
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        alert(result.messages || '发送验证码失败');
        // 刷新验证码
        fetchRegisterCaptcha();
      }
    } catch (error) {
      console.error('发送邮箱验证码失败:', error);
      alert('发送验证码失败，请稍后重试');
      // 刷新验证码
      fetchRegisterCaptcha();
    }
  };

  // 处理注册提交
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证密码一致性
    if (registerForm.password !== registerForm.confirmPassword) {
      alert('两次输入的密码不一致');
      return;
    }
    
    // 验证密码长度
    if (registerForm.password.length < 8 || registerForm.password.length > 20) {
      alert('密码长度应在8-20位之间');
      return;
    }
    
    // 验证用户名长度
    if (registerForm.username.length > 20) {
      alert('用户名长度不能超过20位');
      return;
    }
    
    try {
      const result = await register(
        registerForm.username,
        registerForm.password,
        registerForm.email,
        registerForm.emailCode
      );
      
      if (result.code === 2000) {
        // 注册成功
        setRegisterSuccess(true);
        // 3秒后自动切换到登录模式
        setTimeout(() => {
          setRegisterSuccess(false);
          setIsLogin(true);
          // 重置注册表单
          setRegisterForm({
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            captcha: '',
            emailCode: ''
          });
        }, 3000);
      } else {
        alert(result.messages || '注册失败');
      }
    } catch (error) {
      console.error('注册失败:', error);
      alert('注册失败，请稍后重试');
    }
  };

  // 处理登录表单输入变化
  const handleLoginInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 处理登录提交
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaData) {
      alert('请先获取验证码');
      return;
    }

    try {
      const result = await login(
        loginForm.email,
        loginForm.password,
        loginForm.captcha,
        captchaData.captcha_id
      );

      if (result.code === 2000) {
        // 登录成功
        // 保存用户信息到Redux store
        dispatch(authLogin({
          user: result.data.user,
          accessToken: result.data.access_token
        }));
        // 关闭弹窗
        if (onClose) {
          onClose();
        } else {
          setIsOpen(false);
        }
        // 重置表单
        setLoginForm({
          email: '',
          password: '',
          captcha: ''
        });
        // 调用登录成功回调
        if (onLoginSuccess) {
          onLoginSuccess('登录成功');
        }
      } else {
        alert(result.messages || '登录失败');
        // 刷新验证码
        fetchCaptcha();
      }
    } catch (error) {
      console.error('登录失败:', error);
      alert('登录失败，请稍后重试');
      // 刷新验证码
      fetchCaptcha();
    }
  };

  const shouldShowModal = externalIsOpen !== undefined ? externalIsOpen : isOpen;

  return (
    <>
      {/* 导航栏用户图标 */}
      {!externalIsOpen && (
        <div onClick={handleOpen} style={{ cursor: 'pointer' }}>
          <FaUser size={24} />
        </div>
      )}

      {/* 弹窗遮罩层 */}
      {shouldShowModal && (
        <div className={styles.overlay}>
          <div className={styles.modal} ref={modalRef}>
            {/* 注册成功提示 */}
            {registerSuccess && (
              <div className={styles.successBox}>
                <h2>注册成功</h2>
                <p>请登录您的账号</p>
              </div>
            )}
            
            {!isLogin ? (
              /* 注册框模式 */
              <div className={styles.registerBox}>
                {/* 左侧内容 */}
                <div className={styles.leftPanel}>
                  <div className={styles.iconWrapper}>
                    <MdOutlineVerifiedUser size={48} />
                  </div>
                  <h2>欢迎加入</h2>
                  <p>创建账号，开始您的旅程</p>
                </div>

                {/* 右侧表单 */}
                <div className={styles.rightPanel}>
                  <h2>用户注册</h2>
                  <form onSubmit={handleRegisterSubmit}>
                    <div className={styles.formGroup}>
                      <FaUser className={styles.inputIcon} />
                      <input
                        type="text"
                        name="username"
                        placeholder="请输入用户名（20字以内）"
                        value={registerForm.username}
                        onChange={handleRegisterInputChange}
                        maxLength={20}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <FaEnvelope className={styles.inputIcon} />
                      <input
                        type="email"
                        name="email"
                        placeholder="请输入邮箱"
                        value={registerForm.email}
                        onChange={handleRegisterInputChange}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <FaLock className={styles.inputIcon} />
                      <input
                        type="password"
                        name="password"
                        placeholder="请输入密码（8-20位）"
                        value={registerForm.password}
                        onChange={handleRegisterInputChange}
                        minLength={8}
                        maxLength={20}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <FaLock className={styles.inputIcon} />
                      <input
                        type="password"
                        name="confirmPassword"
                        placeholder="请确认密码"
                        value={registerForm.confirmPassword}
                        onChange={handleRegisterInputChange}
                        required
                      />
                    </div>

                    <div className={styles.verificationContainer}>
                      <MdVerified className={styles.inputIcon} />
                      <input
                        type="text"
                        name="captcha"
                        placeholder="请输入验证码"
                        value={registerForm.captcha}
                        onChange={handleRegisterInputChange}
                        required
                      />

                      <div className={styles.captchaWrapper}>
                        <img
                          src={registerCaptchaData?.pic_path}
                          alt="验证码"
                          className={styles.captchaImage}
                        />
                        <button
                          type="button"
                          onClick={handleRefreshRegisterCaptcha}
                          className={styles.refreshBtn}
                        >
                          <FaRedo />
                        </button>
                      </div>
                    </div>

                    <div className={styles.emailVerificationContainer}>
                      <MdVerified className={styles.inputIcon} />
                      <input
                        type="text"
                        name="emailCode"
                        placeholder="请输入邮箱验证码"
                        value={registerForm.emailCode}
                        onChange={handleRegisterInputChange}
                        required
                      />
                      <button
                        type="button"
                        onClick={handleSendEmailCode}
                        className={styles.sendCodeBtn}
                        disabled={countdown > 0}
                      >
                        {countdown > 0 ? `${countdown}秒后重发` : '发送验证码'}
                      </button>
                    </div>

                    <button
                      type="submit"
                      className={styles.submitBtn}
                      disabled={loading}
                    >
                      {loading ? '注册中...' : '注册'}
                    </button>
                  </form>

                  <div className={styles.switchText}>
                    已有账号？{' '}
                    <span onClick={() => setIsLogin(true)} className={styles.switchLink}>
                      立即登录
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* 登录框模式 */
              <div className={styles.loginBox}>
                {/* 左侧内容 */}
                <div className={styles.leftPanel}>
                  <div className={styles.iconWrapper}>
                    <FaUser size={48} />
                  </div>
                  <h2>欢迎回来</h2>
                  <p>登录您的账号，继续创作之旅</p>
                </div>

                {/* 右侧表单 */}
                <div className={styles.rightPanel}>
                  <h2>用户登录</h2>
                  <form onSubmit={handleLoginSubmit}>
                    <div className={styles.formGroup}>
                      <FaEnvelope className={styles.inputIcon} />
                      <input
                        type="email"
                        name="email"
                        placeholder="请输入邮箱"
                        value={loginForm.email}
                        onChange={handleLoginInputChange}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <FaLock className={styles.inputIcon} />
                      <input
                        type="password"
                        name="password"
                        placeholder="请输入密码"
                        value={loginForm.password}
                        onChange={handleLoginInputChange}
                        required
                      />
                    </div>

                    <div className={styles.verificationContainer}>
                      <MdVerified className={styles.inputIcon} />
                      <input
                        type="text"
                        name="captcha"
                        placeholder="请输入验证码"
                        value={loginForm.captcha}
                        onChange={handleLoginInputChange}
                        required
                      />

                      <div className={styles.captchaWrapper}>
                        <img
                          src={captchaData?.pic_path}
                          alt="验证码"
                          className={styles.captchaImage}
                        />
                        <button
                          type="button"
                          onClick={handleRefreshCaptcha}
                          className={styles.refreshBtn}
                        >
                          <FaRedo />
                        </button>
                      </div>

                    </div>

                    <button
                      type="submit"
                      className={styles.submitBtn}
                      disabled={loading}
                    >
                      {loading ? '登录中...' : '登录'}
                    </button>
                  </form>

                  <div className={styles.switchText}>
                    还没有账号？{' '}
                    <span onClick={() => setIsLogin(false)} className={styles.switchLink}>
                      立即注册
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 关闭按钮 */}
            <button
              className={styles.closeBtn}
              onClick={() => {
                if (onClose) {
                  onClose();
                } else {
                  setIsOpen(false);
                }
              }}
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AuthModal;