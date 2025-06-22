// lib/encryption.ts
import CryptoJS from 'crypto-js';

const SECRET_KEY = '🔥JOKI-SUPER-RAHASIA🔥'; // Ganti jadi yang unik & aman

export const encryptMessage = (message: string): string => {
  return CryptoJS.AES.encrypt(message, SECRET_KEY).toString();
};

export const decryptMessage = (cipherText: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return '[Cannot decrypt]';
  }
};
