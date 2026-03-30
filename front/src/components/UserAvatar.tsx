import React, { useState, useEffect } from 'react';
import { MeepleAvatar } from './MeepleAvatar';
import styles from './UserAvatar.module.sass';

interface UserAvatarProps {
  email?: string;
  name?: string;
  size?: number;
  variant?: 'default' | 'red';
  className?: string;
}

/**
 * UserAvatar: Displays a user's Gravatar with a vintage board game frame.
 * Falls back to MeepleAvatar or initials if the image is missing.
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({
  email,
  name,
  size = 40,
  variant = 'default',
  className = ''
}) => {
  const [error, setError] = useState(false);
  const [hash, setHash] = useState<string>('');

  useEffect(() => {
    if (!email) return;

    const computeHash = async () => {
      try {
        const msgBuffer = new TextEncoder().encode(email.trim().toLowerCase());
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        setHash(hashHex);
      } catch (e) {
        console.error("Hashing failed", e);
      }
    };

    computeHash();
  }, [email]);

  const gravatarUrl = hash ? `https://www.gravatar.com/avatar/${hash}?s=${size * 2}&d=404` : '';

  if (!email || error) {
    return (
      <div 
        className={`${styles.avatarContainer} ${styles[variant]} ${className}`} 
        style={{ width: size, height: size }}
      >
        <div className={styles.fallback}>
          <MeepleAvatar size={size * 0.75} color={variant === 'red' ? 'white' : 'var(--teal)'} />
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`${styles.avatarContainer} ${styles[variant]} ${className}`} 
      style={{ width: size, height: size }}
    >
      <div className={styles.frame}>
        <img
          src={gravatarUrl}
          alt={name || 'User'}
          className={styles.image}
          onError={() => setError(true)}
        />
      </div>
    </div>
  );
};
