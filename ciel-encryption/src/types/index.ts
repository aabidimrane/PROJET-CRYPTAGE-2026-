/** Types d'authentification et de rôles */
export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  service: string;
  email?: string;
  assignedKey?: string;
}

export interface AuthCredentials {
  username: string;
  password: string;
}

/** Types de fichiers */
export interface EncryptedFile {
  id: string;
  name: string;
  service: string;
  encrypted: boolean;
  level: 'Public' | 'Confidentiel' | 'Critique' | 'Top-Secret';
  date: string;
  algorithm: 'AES-256' | 'PBKDF2' | 'Arcane-256';
  size: number;
}

/** Types de logs d'audit */
export type LogSeverity = 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';

export interface AuditLog {
  id: string;
  timestamp: string;
  username: string;
  action: string;
  details: string;
  severity: LogSeverity;
  ipAddress?: string;
}

/** Types de cryptographie */
export type CryptoAlgorithm = 'AES-256' | 'PBKDF2' | 'Arcane-256';

export interface CryptoResult {
  success: boolean;
  data?: string;
  error?: string;
  algorithm: CryptoAlgorithm;
}

/** Tâche de cryptage */
export interface CryptoTask {
  id: string;
  filename: string;
  algorithm: CryptoAlgorithm;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  error?: string;
}
