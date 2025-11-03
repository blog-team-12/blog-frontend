'use client';
import { useState, useEffect } from 'react';
import styles from './index.module.scss';

function Background() {
  const [currentImage, setCurrentImage] = useState(0);
  const images = ['/imgs/background/a.png', '/imgs/background/b.png', '/imgs/background/c.png', '/imgs/background/d.png'];
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  // 切换到下一张图片
  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % images.length);
    resetInterval();
  };

  // 切换到上一张图片
  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
    resetInterval();
  };

  // 跳转到指定图片
  const goToImage = (index: number) => {
    setCurrentImage(index);
    resetInterval();
  };

  // 重置定时器
  const resetInterval = () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
    const id = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 10000); // 10秒切换一次
    setIntervalId(id);
  };

  // 自动轮播效果
  useEffect(() => {
    const id = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 10000); // 10秒切换一次
    setIntervalId(id);

    return () => {
      if (id) clearInterval(id);
    };
  }, [images.length]);

  return (
    <div className={styles.slider}>
      {images.map((src, index) => (
        <div
          key={index}
          className={`${styles.slide} ${currentImage === index ? styles.active : ''}`}
          style={{ backgroundImage: `url(${src})` }}
        />
      ))}

      {/* 左右切换按钮 */}
      <button className={styles.prevButton} onClick={prevImage} aria-label="上一张">
        ❮
      </button>
      <button className={styles.nextButton} onClick={nextImage} aria-label="下一张">
        ❯
      </button>

      {/* 底部指示小点 */}
      <div className={styles.dots}>
        {images.map((_, index) => (
          <button
            key={index}
            className={`${styles.dot} ${currentImage === index ? styles.activeDot : ''}`}
            onClick={() => goToImage(index)}
            aria-label={`切换到第 ${index + 1} 张图片`}
          />
        ))}
      </div>
    </div>
  );
}

export default Background;