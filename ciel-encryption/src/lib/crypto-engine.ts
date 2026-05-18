import CryptoJS from 'crypto-js';
import { CryptoAlgorithm, CryptoResult } from '@/types';

/**
 * Engine de cryptographie CIEL
 * Supporte : AES-256, PBKDF2, Arcane-256
 */

// ============= AES-256 =============
export const AES256Engine = {
  encrypt: (plaintext: string, password: string): string => {
    try {
      const salt = CryptoJS.lib.WordArray.random(128 / 8);
      const key = CryptoJS.PBKDF2(password, salt, {
        keySize: 256 / 32,
        iterations: 1000,
      });
      const iv = CryptoJS.lib.WordArray.random(128 / 8);
      const encrypted = CryptoJS.AES.encrypt(plaintext, key, { iv });
      
      const result = salt.toString() + iv.toString() + encrypted.toString();
      return `AES256$${result}`;
    } catch (error) {
      throw new Error('AES-256 encryption failed');
    }
  },

  decrypt: (ciphertext: string, password: string): string => {
    try {
      if (!ciphertext.startsWith('AES256$')) {
        throw new Error('Invalid AES-256 format');
      }
      
      const data = ciphertext.substring(7);
      const salt = CryptoJS.enc.Hex.parse(data.substring(0, 32));
      const iv = CryptoJS.enc.Hex.parse(data.substring(32, 64));
      const encrypted = data.substring(64);

      const key = CryptoJS.PBKDF2(password, salt, {
        keySize: 256 / 32,
        iterations: 1000,
      });

      const decrypted = CryptoJS.AES.decrypt(encrypted, key, { iv });
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      throw new Error('AES-256 decryption failed');
    }
  },
};

// ============= PBKDF2 =============
export const PBKDF2Engine = {
  hashPassword: (password: string, iterations: number = 100000): string => {
    try {
      const salt = CryptoJS.lib.WordArray.random(128 / 8);
      const derived = CryptoJS.PBKDF2(password, salt, {
        keySize: 256 / 32,
        iterations,
      });
      
      return `PBKDF2$${iterations}$${salt.toString()}$${derived.toString()}`;
    } catch (error) {
      throw new Error('PBKDF2 hashing failed');
    }
  },

  verify: (password: string, hash: string): boolean => {
    try {
      if (!hash.startsWith('PBKDF2$')) {
        return false;
      }

      const parts = hash.split('$');
      const iterations = parseInt(parts[1]);
      const salt = CryptoJS.enc.Hex.parse(parts[2]);
      const storedHash = parts[3];

      const derived = CryptoJS.PBKDF2(password, salt, {
        keySize: 256 / 32,
        iterations,
      });

      return derived.toString() === storedHash;
    } catch (error) {
      return false;
    }
  },

  encrypt: (plaintext: string, password: string): string => {
    try {
      const salt = CryptoJS.lib.WordArray.random(128 / 8);
      const key = CryptoJS.PBKDF2(password, salt, {
        keySize: 256 / 32,
        iterations: 100000,
      });
      
      const encrypted = CryptoJS.AES.encrypt(plaintext, key.toString());
      return `PBKDF2$${salt.toString()}$${encrypted.toString()}`;
    } catch (error) {
      throw new Error('PBKDF2 encryption failed');
    }
  },

  decrypt: (ciphertext: string, password: string): string => {
    try {
      if (!ciphertext.startsWith('PBKDF2$')) {
        throw new Error('Invalid PBKDF2 format');
      }

      const parts = ciphertext.substring(7).split('$');
      const salt = CryptoJS.enc.Hex.parse(parts[0]);
      const encrypted = parts[1];

      const key = CryptoJS.PBKDF2(password, salt, {
        keySize: 256 / 32,
        iterations: 100000,
      });

      const decrypted = CryptoJS.AES.decrypt(encrypted, key.toString());
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      throw new Error('PBKDF2 decryption failed');
    }
  },
};

// ============= ARCANE-256 (Custom Algorithm) =============
// Arcane-256 est un algorithme propriétaire CIEL
// Basé sur une combinaison de XOR avec une clé dérivée et encodage multi-étages
export const Arcane256Engine = {
  encrypt: (plaintext: string, password: string): string => {
    try {
      // Étape 1 : Dérivation de clé avec PBKDF2
      const salt = CryptoJS.lib.WordArray.random(256 / 8);
      const key = CryptoJS.PBKDF2(password, salt, {
        keySize: 512 / 32,
        iterations: 50000,
      });

      // Étape 2 : Encodage UTF-8
      const utf8Text = CryptoJS.enc.Utf8.parse(plaintext);

      // Étape 3 : XOR avec la clé dérivée
      const xored = CryptoJS.lib.WordArray.create();
      for (let i = 0; i < utf8Text.words.length; i++) {
        xored.words[i] = utf8Text.words[i] ^ key.words[i % key.words.length];
      }

      // Étape 4 : Chiffrement supplémentaire avec AES
      const iv = CryptoJS.lib.WordArray.random(128 / 8);
      const encrypted = CryptoJS.AES.encrypt(
        CryptoJS.enc.Base64.stringify(xored),
        key,
        { iv }
      );

      // Étape 5 : Encodage final avec timestamp
      const timestamp = Date.now().toString(16);
      const result = `ARCANE256$${timestamp}$${salt.toString()}$${iv.toString()}$${encrypted.toString()}`;
      
      return result;
    } catch (error) {
      throw new Error('Arcane-256 encryption failed');
    }
  },

  decrypt: (ciphertext: string, password: string): string => {
    try {
      if (!ciphertext.startsWith('ARCANE256$')) {
        throw new Error('Invalid Arcane-256 format');
      }

      const parts = ciphertext.substring(10).split('$');
      if (parts.length < 4) {
        throw new Error('Corrupted Arcane-256 data');
      }

      const salt = CryptoJS.enc.Hex.parse(parts[1]);
      const iv = CryptoJS.enc.Hex.parse(parts[2]);
      const encrypted = parts[3];

      // Dérivation de la même clé
      const key = CryptoJS.PBKDF2(password, salt, {
        keySize: 512 / 32,
        iterations: 50000,
      });

      // Déchiffrement AES
      const decrypted = CryptoJS.AES.decrypt(encrypted, key, { iv });
      const xored = CryptoJS.enc.Base64.parse(
        decrypted.toString(CryptoJS.enc.Utf8)
      );

      // Retrait du XOR
      const result = CryptoJS.lib.WordArray.create();
      for (let i = 0; i < xored.words.length; i++) {
        result.words[i] = xored.words[i] ^ key.words[i % key.words.length];
      }

      return result.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      throw new Error('Arcane-256 decryption failed');
    }
  },
};

// ============= Engine Général =============
const detectAlgorithmFromCiphertext = (ciphertext: string): CryptoAlgorithm | null => {
  if (ciphertext.startsWith('AES256$')) return 'AES-256';
  if (ciphertext.startsWith('PBKDF2$')) return 'PBKDF2';
  if (ciphertext.startsWith('ARCANE256$')) return 'Arcane-256';
  return null;
};

export const CryptoEngine = {
  encrypt: (
    plaintext: string,
    password: string,
    algorithm: CryptoAlgorithm
  ): CryptoResult => {
    try {
      let encrypted: string;

      switch (algorithm) {
        case 'AES-256':
          encrypted = AES256Engine.encrypt(plaintext, password);
          break;
        case 'PBKDF2':
          encrypted = PBKDF2Engine.encrypt(plaintext, password);
          break;
        case 'Arcane-256':
          encrypted = Arcane256Engine.encrypt(plaintext, password);
          break;
        default:
          throw new Error(`Unknown algorithm: ${algorithm}`);
      }

      return {
        success: true,
        data: encrypted,
        algorithm,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Encryption failed',
        algorithm,
      };
    }
  },

  decrypt: (
    ciphertext: string,
    password: string,
    algorithm: CryptoAlgorithm
  ): CryptoResult => {
    try {
      const detectedAlgorithm = detectAlgorithmFromCiphertext(ciphertext);
      const selectedAlgorithm = detectedAlgorithm ?? algorithm;
      let decrypted: string;

      switch (selectedAlgorithm) {
        case 'AES-256':
          decrypted = AES256Engine.decrypt(ciphertext, password);
          break;
        case 'PBKDF2':
          decrypted = PBKDF2Engine.decrypt(ciphertext, password);
          break;
        case 'Arcane-256':
          decrypted = Arcane256Engine.decrypt(ciphertext, password);
          break;
        default:
          throw new Error(`Unknown algorithm: ${selectedAlgorithm}`);
      }

      return {
        success: true,
        data: decrypted,
        algorithm: selectedAlgorithm,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Decryption failed',
        algorithm,
      };
    }
  },

  hashPassword: (password: string): string => {
    return PBKDF2Engine.hashPassword(password);
  },

  verifyPassword: (password: string, hash: string): boolean => {
    return PBKDF2Engine.verify(password, hash);
  },
};
