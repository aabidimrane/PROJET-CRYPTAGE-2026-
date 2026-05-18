import { User, EncryptedFile } from '@/types';
import { CryptoEngine } from './crypto-engine';

/**
 * Base de données utilisateurs CIEL
 * Les mots de passe sont hashés avec PBKDF2
 */
export const AUTHORIZED_USERS: (User & { passwordHash: string })[] = [
  {
    id: 'admin-001',
    username: 'admin',
    name: 'Directeur Cyber-Sécurité',
    role: 'ADMIN',
    service: 'Tous',
    email: 'admin@ciel.fr',
    passwordHash: CryptoEngine.hashPassword('ciel_root_password'),
  },
  {
    id: 'user-rh-001',
    username: 'rh_user',
    name: 'Sophie Martin',
    role: 'USER',
    service: 'RH',
    email: 'sophie.martin@ciel.fr',
    passwordHash: CryptoEngine.hashPassword('rh_password_2024'),
    assignedKey: 'rh_key_2024',
  },
  {
    id: 'user-it-001',
    username: 'it_user',
    name: 'Lucas Bernard',
    role: 'USER',
    service: 'Informatique',
    email: 'lucas.bernard@ciel.fr',
    passwordHash: CryptoEngine.hashPassword('it_password_2024'),
    assignedKey: 'it_key_2024',
  },
  {
    id: 'user-dir-001',
    username: 'dir_user',
    name: 'Marc Lefebvre',
    role: 'USER',
    service: 'Direction',
    email: 'marc.lefebvre@ciel.fr',
    passwordHash: CryptoEngine.hashPassword('dir_password_2024'),
    assignedKey: 'dir_key_2024',
  },
  {
    id: 'user-fin-001',
    username: 'fin_user',
    name: 'Claire Dupont',
    role: 'USER',
    service: 'Finances',
    email: 'claire.dupont@ciel.fr',
    passwordHash: CryptoEngine.hashPassword('fin_password_2024'),
    assignedKey: 'fin_key_2024',
  },
];

/**
 * Fichiers disponibles dans l'entreprise CIEL
 * Chaque fichier est associé à un service
 * Les utilisateurs ne peuvent voir les fichiers de leur service (sauf ADMIN)
 */
export const INITIAL_FILES: EncryptedFile[] = [
  {
    id: 'file-001',
    name: 'contrats_cadres_2024.pdf',
    service: 'RH',
    encrypted: false,
    level: 'Confidentiel',
    date: '12/05/2024',
    algorithm: 'AES-256',
    size: 2048,
  },
  {
    id: 'file-002',
    name: 'schema_reseau_coeur.svg',
    service: 'Informatique',
    encrypted: false,
    level: 'Critique',
    date: '10/05/2024',
    algorithm: 'Arcane-256',
    size: 1024,
  },
  {
    id: 'file-003',
    name: 'bilan_financier_q1.xlsx',
    service: 'Finances',
    encrypted: false,
    level: 'Top-Secret',
    date: '14/05/2024',
    algorithm: 'AES-256',
    size: 512,
  },
  {
    id: 'file-004',
    name: 'procedure_urgence.pdf',
    service: 'Tous',
    encrypted: false,
    level: 'Public',
    date: '01/01/2024',
    algorithm: 'AES-256',
    size: 256,
  },
  {
    id: 'file-005',
    name: 'code_source_arcane_v2.c',
    service: 'Informatique',
    encrypted: true,
    level: 'Critique',
    date: '08/05/2024',
    algorithm: 'Arcane-256',
    size: 4096,
  },
  {
    id: 'file-006',
    name: 'strategie_rh_2024.docx',
    service: 'RH',
    encrypted: true,
    level: 'Confidentiel',
    date: '20/04/2024',
    algorithm: 'PBKDF2',
    size: 768,
  },
  {
    id: 'file-007',
    name: 'budget_previsionnel.xlsx',
    service: 'Direction',
    encrypted: true,
    level: 'Top-Secret',
    date: '25/04/2024',
    algorithm: 'AES-256',
    size: 2560,
  },
  {
    id: 'file-008',
    name: 'audit_securite_2023.pdf',
    service: 'Tous',
    encrypted: false,
    level: 'Confidentiel',
    date: '15/05/2024',
    algorithm: 'AES-256',
    size: 1536,
  },
];

/**
 * Statistiques du système
 */
export const SYSTEM_STATS = {
  totalNodes: 12,
  activeNodes: 8,
  encryptionStandard: 'AES-256 + PBKDF2 + Arcane-256',
  backupFrequency: 'Quotidienne (03:00 UTC)',
  lastBackup: new Date(Date.now() - 3600000).toLocaleString('fr-FR'),
};
