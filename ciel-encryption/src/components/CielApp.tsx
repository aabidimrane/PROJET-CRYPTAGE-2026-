'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Lock,
  Unlock,
  ShieldCheck,
  FileLock2,
  LayoutDashboard,
  LogOut,
  AlertCircle,
  Database,
  ShieldAlert,
  Eye,
  EyeOff,
  History,
  Search,
  Zap,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import CielLogo from './CielLogo';
import { User, EncryptedFile, AuditLog, CryptoAlgorithm, LogSeverity } from '@/types';
import { CryptoEngine } from '@/lib/crypto-engine';
import { AUTHORIZED_USERS, INITIAL_FILES } from '@/lib/database';

type ViewType = 'dashboard' | 'crypto' | 'audit' | 'users';

export default function CielApp() {
  // State
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewType>('dashboard');
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [cryptoInput, setCryptoInput] = useState('');
  const [cryptoKey, setCryptoKey] = useState('');
  const [cryptoOutput, setCryptoOutput] = useState('');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<CryptoAlgorithm>('AES-256');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cryptoMode, setCryptoMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [fileMode, setFileMode] = useState<'text' | 'file'>('text');
  const [lastCryptoStatus, setLastCryptoStatus] = useState<{ success: boolean; message: string } | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileResult, setFileResult] = useState<{
    filename: string;
    content: string | Uint8Array;
    mimeType: string;
    isBinary: boolean;
  } | null>(null);
  const [fileStatus, setFileStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isFileProcessing, setIsFileProcessing] = useState(false);

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [files, setFiles] = useState<EncryptedFile[]>(INITIAL_FILES);
  const [users, setUsers] = useState<(User & { passwordHash: string })[]>(AUTHORIZED_USERS);
  const [newUser, setNewUser] = useState({
    username: '',
    name: '',
    email: '',
    service: 'RH',
    role: 'USER' as User['role'],
    password: '',
    assignedKey: '',
  });

  const addLog = useCallback(
    (action: string, details: string, severity: LogSeverity = 'INFO') => {
      const newLog: AuditLog = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleString('fr-FR'),
        username: user?.username || 'Système',
        action,
        details,
        severity,
      };
      setLogs((prev) => [newLog, ...prev]);
    },
    [user?.username]
  );

  const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new Error('Lecture de fichier impossible'));
        }
      };
      reader.onerror = () => reject(new Error('Erreur de lecture de fichier'));
      reader.readAsArrayBuffer(file);
    });

  const toBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i += 1) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const fromBase64 = (base64: string): Uint8Array => {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  };

  const downloadFile = (filename: string, content: string | Uint8Array, mimeType: string) => {
    const blob = content instanceof Uint8Array ? new Blob([new Uint8Array(content)], { type: mimeType }) : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileOperation = async () => {
    if (!cryptoKey) {
      setFileStatus({ success: false, message: 'Veuillez entrer une clé de chiffrement.' });
      return;
    }

    setIsFileProcessing(true);
    setFileStatus(null);
    setFileResult(null);

    try {
      if (fileMode === 'file' && !selectedFile) {
        throw new Error('Sélectionnez un fichier pour continuer.');
      }

      let payload: string;
      let filename = 'resultat';
      let mimeType = 'application/octet-stream';
      let isBinary = false;

      if (cryptoMode === 'encrypt') {
        const file = selectedFile as File;
        const buffer = await readFileAsArrayBuffer(file);
        const base64 = toBase64(buffer);
        const metadata = JSON.stringify({
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          data: base64,
        });
        const result = CryptoEngine.encrypt(metadata, cryptoKey, selectedAlgorithm);
        if (!result.success || !result.data) {
          throw new Error(result.error || 'Erreur de chiffrement du fichier');
        }
        payload = result.data;
        filename = `${file.name}.cielfile`;
        mimeType = 'text/plain;charset=utf-8';
      } else {
        const file = selectedFile as File;
        const encryptedText = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              resolve(reader.result);
            } else {
              reject(new Error('Lecture du fichier chiffré impossible'));}
          };
          reader.onerror = () => reject(new Error('Erreur de lecture du fichier chiffré'));
          reader.readAsText(file);
        });
        const result = CryptoEngine.decrypt(encryptedText, cryptoKey, selectedAlgorithm);
        if (!result.success || !result.data) {
          throw new Error(result.error || 'Erreur de déchiffrement du fichier');
        }
        const metadata = JSON.parse(result.data);
        if (!metadata.filename || !metadata.data) {
          throw new Error('Format de fichier chiffré invalide');
        }
        const bytes = fromBase64(metadata.data);
        payload = '';
        filename = metadata.filename;
        mimeType = metadata.mimeType || 'application/octet-stream';
        isBinary = true;
        setFileResult({ filename, content: bytes, mimeType, isBinary });
        setFileStatus({ success: true, message: `Fichier déchiffré : ${filename}` });
        addLog('FILE_DECRYPT', `Fichier déchiffré : ${filename}`, 'SUCCESS');
        setIsFileProcessing(false);
        return;
      }

      setFileResult({ filename, content: payload, mimeType, isBinary: false });
      setFileStatus({ success: true, message: `Fichier chiffré prêt à télécharger (${filename})` });
      addLog('FILE_ENCRYPT', `Fichier chiffré : ${filename}`, 'SUCCESS');
    } catch (error) {
      setFileStatus({ success: false, message: error instanceof Error ? error.message : 'Erreur de traitement du fichier' });
      addLog('FILE_ERROR', error instanceof Error ? error.message : 'Erreur de traitement du fichier', 'ERROR');
    } finally {
      setIsFileProcessing(false);
    }
  };

  const handleDownloadResult = () => {
    if (!fileResult) return;
    downloadFile(fileResult.filename, fileResult.content, fileResult.mimeType);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password || !newUser.name || !newUser.service || (newUser.role === 'USER' && !newUser.assignedKey)) {
      setLastCryptoStatus({ success: false, message: 'Tous les champs sont requis, incluant la clé de déchiffrement pour les utilisateurs.' });
      return;
    }

    const duplicate = users.some((u) => u.username === newUser.username || u.email === newUser.email);
    if (duplicate) {
      setLastCryptoStatus({ success: false, message: 'Nom d’utilisateur ou email déjà utilisé.' });
      return;
    }

    const createdUser = {
      id: `user-${Date.now()}`,
      username: newUser.username,
      name: newUser.name,
      role: newUser.role,
      service: newUser.service,
      email: newUser.email,
      assignedKey: newUser.assignedKey || undefined,
      passwordHash: CryptoEngine.hashPassword(newUser.password),
    };

    setUsers((prev) => [createdUser, ...prev]);
    setNewUser({ username: '', name: '', email: '', service: 'RH', role: 'USER', password: '', assignedKey: '' });
    setLastCryptoStatus({ success: true, message: `Compte créé pour ${createdUser.username}` });
    addLog('USER_CREATE', `Nouvel utilisateur créé : ${createdUser.username}`, 'SUCCESS');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setLoginError('');

    await new Promise((resolve) => setTimeout(resolve, 500));

    const foundUser = users.find((u) => u.username === credentials.username);

    if (
      foundUser &&
      CryptoEngine.verifyPassword(credentials.password, foundUser.passwordHash)
    ) {
      const { passwordHash, ...userWithoutHash } = foundUser;
      setUser(userWithoutHash);
      setCryptoKey(userWithoutHash.assignedKey || '');
      addLog('CONNEXION', `Authentification réussie`, 'SUCCESS');
      setCredentials({ username: '', password: '' });
    } else {
      setLoginError('Identifiant ou mot de passe incorrect.');
      addLog('ALERTE_AUTH', `Tentative échouée : ${credentials.username}`, 'WARNING');
    }
    setIsAuthenticating(false);
  };

  const handleLogout = () => {
    addLog('DECONNEXION', `Session fermée`, 'INFO');
    setUser(null);
  };

  const handleCryptoOperation = async () => {
    if (!cryptoInput || !cryptoKey) {
      setLastCryptoStatus({
        success: false,
        message: 'Veuillez remplir tous les champs',
      });
      return;
    }

    setIsProcessing(true);
    setLastCryptoStatus(null);

    await new Promise((resolve) => setTimeout(resolve, 600));

    const result =
      cryptoMode === 'encrypt'
        ? CryptoEngine.encrypt(cryptoInput, cryptoKey, selectedAlgorithm)
        : CryptoEngine.decrypt(cryptoInput, cryptoKey, selectedAlgorithm);

    if (result.success) {
      setCryptoOutput(result.data || '');
      setLastCryptoStatus({
        success: true,
        message: `${cryptoMode === 'encrypt' ? 'Chiffrement' : 'Déchiffrement'} réussi avec ${result.algorithm}`,
      });
      addLog(
        'CRYPTO',
        `${cryptoMode === 'encrypt' ? 'Chiffrement' : 'Déchiffrement'} - ${result.algorithm}`,
        'SUCCESS'
      );
    } else {
      setCryptoOutput('');
      setLastCryptoStatus({
        success: false,
        message: result.error || 'Erreur lors du traitement',
      });
      addLog('CRYPTO_ERROR', result.error || 'Erreur', 'ERROR');
    }

    setIsProcessing(false);
  };

  const filteredFiles = useMemo(() => {
    if (!user) return [];
    if (user.role === 'ADMIN') return files;
    return files.filter((f) => f.service === user.service || f.service === 'Tous');
  }, [user, files]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const canEditCryptoKey = user?.role === 'ADMIN' || cryptoMode === 'encrypt';
  const cryptoKeyPlaceholder = canEditCryptoKey
    ? 'Entrez votre clé super secrète...'
    : 'Clé assignée par l’administrateur';

  // Render Login
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 font-sans">
        <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />

        <div className="relative max-w-md w-full bg-slate-900/80 backdrop-blur-xl rounded-[3rem] border border-slate-700/50 shadow-2xl overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 via-blue-500 to-sky-500 shadow-[0_0_20px_rgba(14,165,233,0.8)]" />
          <div className="absolute -right-40 -top-40 w-80 h-80 rounded-full bg-sky-500/10 blur-3xl" />

          <div className="relative p-12 z-10">
            <div className="flex justify-center mb-12">
              <div className="p-3 bg-gradient-to-br from-sky-500/20 to-blue-600/20 rounded-full border border-sky-500/30 hover:scale-110 transition-transform duration-500">
                <CielLogo className="w-32 h-32" />
              </div>
            </div>

            <h1 className="text-3xl font-black text-white text-center mb-2 tracking-tight">
              CIEL <span className="text-sky-400">[IR]</span>
            </h1>
            <p className="text-xs text-slate-400 text-center mb-8 tracking-widest uppercase">
              Système de Chiffrement Sécurisé
            </p>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">
                  Identifiant
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-2xl py-4 px-6 text-white text-sm focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 outline-none transition-all placeholder-slate-600"
                  placeholder="admin"
                  disabled={isAuthenticating}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    className="w-full bg-slate-950/50 border border-slate-700 rounded-2xl py-4 px-6 text-white text-sm focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 outline-none transition-all placeholder-slate-600"
                    placeholder="••••••••"
                    disabled={isAuthenticating}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-4 text-slate-500 hover:text-sky-400 transition-colors disabled:opacity-50"
                    disabled={isAuthenticating}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-3">
                  <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                  <p className="text-red-400 text-[10px] font-bold uppercase tracking-tighter">{loginError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-600 text-white font-black py-4 rounded-2xl uppercase text-xs tracking-[0.2em] shadow-lg shadow-sky-900/30 transition-all active:scale-95 disabled:cursor-not-allowed"
              >
                {isAuthenticating ? 'Vérification...' : 'Authentification [IR]'}
              </button>

              <div className="mt-8 pt-6 border-t border-slate-700/50">
                <p className="text-[9px] text-slate-500 mb-3 text-center font-bold uppercase tracking-widest">
                  Comptes de Démonstration
                </p>
                <div className="space-y-2 text-[9px] text-slate-400 font-mono text-center">
                  <div>admin / ciel_root_password</div>
                  <div>rh_user / rh_password_2024</div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Render App
  const sidebarContent = (
    <aside className="w-80 border-r border-slate-800 bg-slate-900/50 backdrop-blur-xl flex flex-col sticky top-0 h-screen overflow-y-auto">
      <div className="p-8 flex items-center gap-4 border-b border-slate-800">
        <CielLogo className="w-12 h-12" />
        <h1 className="text-xl font-black text-white italic tracking-tighter">
          CIEL <span className="text-sky-500">[IR]</span>
        </h1>
      </div>

      <nav className="flex-1 px-6 space-y-2 py-8">
        <button
          onClick={() => setView('dashboard')}
          className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all ${
            view === 'dashboard'
              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
              : 'text-slate-500 hover:bg-white/5'
          }`}
        >
          <LayoutDashboard size={20} /> Dashboard
        </button>
        <button
          onClick={() => setView('crypto')}
          className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all ${
            view === 'crypto'
              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
              : 'text-slate-500 hover:bg-white/5'
          }`}
        >
          <FileLock2 size={20} /> Cryptographie
        </button>
        {user.role === 'ADMIN' && (
          <>
            <button
              onClick={() => setView('audit')}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all ${
                view === 'audit'
                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                  : 'text-slate-500 hover:bg-white/5'
              }`}
            >
              <History size={20} /> Audit Sécurité
            </button>
            <button
              onClick={() => setView('users')}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all ${
                view === 'users'
                  ? 'bg-teal-500/10 text-teal-500 border border-teal-500/30'
                  : 'text-slate-500 hover:bg-white/5'
              }`}
            >
              <ShieldCheck size={20} /> Gestion Utilisateurs
            </button>
          </>
        )}
      </nav>

      <div className="p-6 border-t border-slate-800">
        <div className="bg-slate-800/40 rounded-3xl p-5 border border-slate-700/50 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-black text-base">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-black text-white truncate">{user.name}</p>
              <p className="text-[9px] text-sky-400 font-bold uppercase tracking-tighter">
                {user.role === 'ADMIN' ? '👑 ADMIN' : user.service}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={14} /> Déconnexion
          </button>
        </div>
      </div>
    </aside>
  );

  // Dashboard View
  if (view === 'dashboard') {
    return (
      <div className="flex h-screen bg-slate-950 text-slate-300 font-sans">
        {sidebarContent}

        <main className="flex-1 overflow-auto bg-slate-950 p-12">
          <header className="mb-12 flex justify-between items-center">
            <div>
              <h2 className="text-4xl font-black text-white tracking-tight uppercase italic">Dashboard</h2>
              <p className="text-xs font-bold text-slate-500 tracking-widest mt-2 uppercase">
                Système BTS CIEL [IR] - Environnement Sécurisé
              </p>
            </div>
            <div className="px-6 py-3 bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center gap-3 backdrop-blur">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-black uppercase text-slate-400">Service : {user.service}</span>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {[
              { label: 'Documents Accessibles', value: filteredFiles.length, icon: Database, color: 'text-sky-500' },
              { label: 'Grade Accès', value: user.role === 'ADMIN' ? '👑 ADMIN' : 'LEVEL-1', icon: ShieldCheck, color: 'text-emerald-500' },
              { label: 'Nœuds Actifs', value: '08/12', icon: ShieldAlert, color: 'text-amber-500' },
              { label: 'Algorithme', value: '3 Types', icon: Lock, color: 'text-purple-500' },
            ].map((stat, i) => (
              <div key={i} className="bg-slate-900/40 border border-slate-800 p-6 rounded-[2rem] hover:border-slate-700 transition-all group">
                <stat.icon className={`${stat.color} mb-4 group-hover:scale-110 transition-transform`} size={24} />
                <p className="text-[10px] font-black text-slate-600 uppercase mb-2">{stat.label}</p>
                <p className="text-2xl font-black text-white italic tracking-tighter">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] overflow-hidden backdrop-blur-md">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-white/5">
              <h3 className="text-xs font-black uppercase text-sky-400 tracking-widest">
                Base de Données [IR] - {filteredFiles.length} Document{filteredFiles.length > 1 ? 's' : ''}
              </h3>
              <Search size={16} className="text-slate-500" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-slate-800/50 bg-slate-950/50">
                    <th className="px-8 py-5 text-sky-500">Document</th>
                    <th className="px-8 py-5">Classification</th>
                    <th className="px-8 py-5">Algorithme</th>
                    <th className="px-8 py-5">Taille</th>
                    <th className="px-8 py-5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {filteredFiles.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-12 text-center text-slate-600 text-sm">
                        Aucun document accessible
                      </td>
                    </tr>
                  ) : (
                    filteredFiles.map((file) => (
                      <tr key={file.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-8 py-6 flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${file.encrypted ? 'bg-amber-500/10 text-amber-500' : 'bg-sky-500/10 text-sky-500'}`}>
                            {file.encrypted ? <Lock size={16} /> : <Unlock size={16} />}
                          </div>
                          <span className="text-sm font-bold text-slate-200 truncate">{file.name}</span>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-[9px] font-black bg-slate-800 px-3 py-1 rounded-lg uppercase text-slate-400">
                            {file.level}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-[9px] font-black px-3 py-1 rounded-lg bg-sky-500/10 text-sky-400 uppercase">
                            {file.algorithm}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-xs font-mono text-slate-500">{formatFileSize(file.size)}</td>
                        <td className="px-8 py-6 text-xs font-mono text-slate-600">{file.date}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Crypto View
  if (view === 'crypto') {
    return (
      <div className="flex h-screen bg-slate-950 text-slate-300 font-sans">
        {sidebarContent}

        <main className="flex-1 overflow-auto bg-slate-950 p-12">
          <header className="mb-12 flex justify-between items-center">
            <div>
              <h2 className="text-4xl font-black text-white tracking-tight uppercase italic">Cryptographie</h2>
              <p className="text-xs font-bold text-slate-500 tracking-widest mt-2 uppercase">
                Chiffrement et Déchiffrement Sécurisé
              </p>
            </div>
            <div className="px-6 py-3 bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center gap-3 backdrop-blur">
              <Zap size={16} className="text-yellow-500" />
              <span className="text-[10px] font-black uppercase text-slate-400">{selectedAlgorithm}</span>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="bg-slate-900/40 border border-slate-800 p-10 rounded-[3rem] space-y-8 shadow-xl h-fit">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-2">
                  Mode de Traitement
                </label>
                <div className="flex gap-4">
                  {['encrypt', 'decrypt'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setCryptoMode(mode as 'encrypt' | 'decrypt')}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all ${
                        cryptoMode === mode
                          ? 'bg-sky-500/20 border border-sky-500/50 text-sky-300'
                          : 'bg-slate-800/20 border border-slate-700 text-slate-400 hover:bg-slate-800/40'
                      }`}
                    >
                      {mode === 'encrypt' ? '🔒 Chiffrer' : '🔓 Déchiffrer'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-2">
              Type de Données
            </label>
            <div className="flex gap-4">
              {['text', 'file'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFileMode(mode as 'text' | 'file')}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all ${
                    fileMode === mode
                      ? 'bg-sky-500/20 border border-sky-500/50 text-sky-300'
                      : 'bg-slate-800/20 border border-slate-700 text-slate-400 hover:bg-slate-800/40'
                  }`}
                >
                  {mode === 'text' ? 'Texte' : 'Fichier'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-2">
              Algorithme de Chiffrement
            </label>
            <select
              value={selectedAlgorithm}
              onChange={(e) => setSelectedAlgorithm(e.target.value as CryptoAlgorithm)}
              className="w-full bg-slate-950/50 border border-slate-700 rounded-2xl py-3 px-6 text-white text-sm focus:ring-2 focus:ring-sky-500/50 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="AES-256">AES-256 (Recommandé)</option>
              <option value="PBKDF2">PBKDF2 (Dérivation de Clé)</option>
              <option value="Arcane-256">Arcane-256 (Propriétaire CIEL)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-2">
              Clé de Chiffrement
            </label>
            <input
              type="password"
              value={cryptoKey}
              onChange={(e) => canEditCryptoKey && setCryptoKey(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-700 rounded-2xl py-4 px-6 text-white text-sm focus:ring-2 focus:ring-sky-500/50 outline-none transition-all placeholder-slate-600"
              placeholder={cryptoKeyPlaceholder}
              disabled={!canEditCryptoKey || isProcessing || isFileProcessing}
            />
            <p className="text-[9px] text-slate-500 ml-2">
              {user?.role !== 'ADMIN' && cryptoMode === 'decrypt'
                ? 'Vous utilisez la clé attribuée par l’administrateur pour déchiffrer.'
                : 'Minimum 12 caractères pour une sécurité optimale'}
            </p>
          </div>

          {fileMode === 'text' ? (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-2">
                Données à Traiter
              </label>
              <textarea
                rows={8}
                value={cryptoInput}
                onChange={(e) => setCryptoInput(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-700 rounded-3xl p-6 text-sm font-mono text-sky-100 focus:ring-2 focus:ring-sky-500/50 outline-none resize-none transition-all placeholder-slate-600"
                placeholder={cryptoMode === 'encrypt' ? 'Texte à chiffrer...' : 'Données chiffrées...'}
                disabled={isProcessing}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-2">
                Fichier sélectionné
              </label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="px-4 py-3 rounded-2xl bg-slate-800/60 border border-slate-700 text-slate-300 text-[10px] uppercase tracking-[0.3em] font-black"
                >
                  Réinitialiser
                </button>
                <span className="text-[11px] text-slate-400 font-mono">
                  {selectedFile ? `${selectedFile.name} • ${formatFileSize(selectedFile.size)}` : 'Aucun fichier choisi'}
                </span>
              </div>
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full text-[10px] text-slate-300 file:bg-slate-800 file:border file:border-slate-700 file:px-4 file:py-3 file:rounded-2xl file:text-slate-200 file:font-bold"
                disabled={isFileProcessing}
              />
              {cryptoMode === 'decrypt' && (
                <p className="text-[9px] text-slate-500 ml-2">
                  Importez le fichier chiffré au format texte `.cielfile` pour le déchiffrer.
                </p>
              )}
            </div>
          )}

          {fileStatus && (
            <div className={`rounded-xl p-3 flex items-center gap-3 ${
              fileStatus.success
                ? 'bg-emerald-500/10 border border-emerald-500/30'
                : 'bg-red-500/10 border border-red-500/30'
            }`}>
              {fileStatus.success ? (
                <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
              ) : (
                <XCircle size={16} className="text-red-500 flex-shrink-0" />
              )}
              <p className={`text-[9px] font-bold uppercase tracking-tighter ${fileStatus.success ? 'text-emerald-400' : 'text-red-400'}`}>
                {fileStatus.message}
              </p>
            </div>
          )}

          {lastCryptoStatus && fileMode === 'text' && (
            <div
              className={`rounded-xl p-3 flex items-center gap-3 ${
                lastCryptoStatus.success
                  ? 'bg-emerald-500/10 border border-emerald-500/30'
                  : 'bg-red-500/10 border border-red-500/30'
              }`}
            >
              {lastCryptoStatus.success ? (
                <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
              ) : (
                <XCircle size={16} className="text-red-500 flex-shrink-0" />
              )}
              <p className={`text-[9px] font-bold uppercase tracking-tighter ${lastCryptoStatus.success ? 'text-emerald-400' : 'text-red-400'}`}>
                {lastCryptoStatus.message}
              </p>
            </div>
          )}

          <button
            onClick={fileMode === 'text' ? handleCryptoOperation : handleFileOperation}
            disabled={
              isProcessing || isFileProcessing || !cryptoKey ||
              (fileMode === 'text' ? !cryptoInput : !selectedFile)
            }
                className="w-full py-4 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 disabled:cursor-not-allowed shadow-lg shadow-sky-900/30 flex items-center justify-center gap-2"
              >
                {(isProcessing || isFileProcessing) ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Traitement en cours...
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    {cryptoMode === 'encrypt'
                      ? fileMode === 'text'
                        ? 'Chiffrer le texte'
                        : 'Chiffrer le fichier'
                      : fileMode === 'text'
                        ? 'Déchiffrer le texte'
                        : 'Déchiffrer le fichier'}
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-950/50 border border-slate-800 p-10 rounded-[3rem] flex flex-col items-center justify-center relative overflow-hidden group h-fit min-h-[600px]">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                <CielLogo className="w-64 h-64" />
              </div>

              <div className="relative w-full h-full flex flex-col z-10">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-6">
                  Résultat du Terminal
                </h3>
                <div className="flex-1 bg-black/40 border border-white/10 rounded-2xl p-8 font-mono text-xs break-all text-sky-400 shadow-inner overflow-auto">
                  {cryptoOutput ? (
                    <>
                      <div className="text-emerald-400 mb-2">&gt; Résultat obtenu</div>
                      <div className="select-all text-sky-300 font-bold break-words whitespace-pre-wrap">
                        {cryptoOutput}
                      </div>
                      <div className="text-slate-600 mt-4 text-[10px]">
                        {cryptoOutput.length} caractères • {(cryptoOutput.length / 1024).toFixed(2)} KB
                      </div>
                    </>
                  ) : (
                    <div className="text-slate-500 animate-pulse">&gt; En attente d'instruction...</div>
                  )}
                </div>

                {fileMode === 'text' && cryptoOutput && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(cryptoOutput);
                      addLog('CRYPTO', 'Résultat copié', 'INFO');
                    }}
                    className="mt-6 w-full py-3 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2"
                  >
                    📋 Copier le Résultat
                  </button>
                )}
                {fileMode === 'file' && fileResult && (
                  <button
                    onClick={handleDownloadResult}
                    className="mt-6 w-full py-3 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2"
                  >
                    📥 Télécharger {fileResult.filename}
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Audit View (Admin only)
  if (view === 'audit' && user.role === 'ADMIN') {
    return (
      <div className="flex h-screen bg-slate-950 text-slate-300 font-sans">
        {sidebarContent}

        <main className="flex-1 overflow-auto bg-slate-950 p-12">
          <header className="mb-12 flex justify-between items-center">
            <div>
              <h2 className="text-4xl font-black text-white tracking-tight uppercase italic">Audit Sécurité</h2>
              <p className="text-xs font-bold text-slate-500 tracking-widest mt-2 uppercase">
                Journaux d'Activité du Système CIEL
              </p>
            </div>
            <button
              onClick={() => setLogs([])}
              className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 rounded-xl text-[10px] font-black uppercase transition-all"
            >
              🗑️ Réinitialiser les Logs
            </button>
          </header>

          <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] overflow-hidden backdrop-blur-md">
            <div className="p-6 border-b border-slate-800 bg-white/5">
              <h3 className="font-black text-sm uppercase italic text-amber-500 tracking-tighter">
                📋 Historique Complet ({logs.length} événement{logs.length !== 1 ? 's' : ''})
              </h3>
            </div>

            <div className="max-h-[600px] overflow-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-900 sticky top-0">
                  <tr className="text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-slate-800">
                    <th className="px-8 py-4">Timestamp</th>
                    <th className="px-8 py-4">Utilisateur</th>
                    <th className="px-8 py-4">Action</th>
                    <th className="px-8 py-4">Détails</th>
                    <th className="px-8 py-4 text-right">Sévérité</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-12 text-center text-slate-600 italic text-sm">
                        ℹ️ Aucun événement enregistré pour le moment
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-8 py-4 text-[9px] font-mono text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                        <td className="px-8 py-4 font-black text-xs text-sky-400 uppercase tracking-tighter">
                          {log.username}
                        </td>
                        <td className="px-8 py-4 text-xs font-bold text-slate-300">{log.action}</td>
                        <td className="px-8 py-4 text-xs text-slate-400">{log.details}</td>
                        <td className="px-8 py-4 text-right">
                          <span
                            className={`text-[9px] font-black px-2 py-1 rounded uppercase tracking-tighter ${
                              log.severity === 'SUCCESS'
                                ? 'text-emerald-400 bg-emerald-500/10'
                                : log.severity === 'ERROR'
                                  ? 'text-red-400 bg-red-500/10'
                                  : log.severity === 'WARNING'
                                    ? 'text-amber-400 bg-amber-500/10'
                                    : 'text-slate-400 bg-slate-500/10'
                            }`}
                          >
                            {log.severity}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (view === 'users' && user.role === 'ADMIN') {
    return (
      <div className="flex h-screen bg-slate-950 text-slate-300 font-sans">
        {sidebarContent}

        <main className="flex-1 overflow-auto bg-slate-950 p-12">
          <header className="mb-12 flex justify-between items-center">
            <div>
              <h2 className="text-4xl font-black text-white tracking-tight uppercase italic">Gestion des Comptes</h2>
              <p className="text-xs font-bold text-slate-500 tracking-widest mt-2 uppercase">
                Créez et gérez les comptes des collaborateurs
              </p>
            </div>
          </header>

          <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-8">
            <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 space-y-6">
              <h3 className="text-sm font-black uppercase tracking-[0.3em] text-teal-400">Créer un nouvel utilisateur</h3>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    value={newUser.username}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, username: e.target.value }))}
                    placeholder="Nom d’utilisateur"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950/50 py-4 px-6 text-sm text-white"
                    required
                  />
                  <input
                    value={newUser.name}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Nom complet"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950/50 py-4 px-6 text-sm text-white"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    value={newUser.email}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
                    type="email"
                    placeholder="Email"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950/50 py-4 px-6 text-sm text-white"
                    required
                  />
                  <input
                    value={newUser.password}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
                    type="password"
                    placeholder="Mot de passe"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950/50 py-4 px-6 text-sm text-white"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value as User['role'] }))}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950/50 py-4 px-6 text-sm text-white"
                  >
                    <option value="USER">Utilisateur</option>
                    <option value="ADMIN">Administrateur</option>
                  </select>
                  <select
                    value={newUser.service}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, service: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950/50 py-4 px-6 text-sm text-white"
                  >
                    <option value="RH">RH</option>
                    <option value="Informatique">Informatique</option>
                    <option value="Direction">Direction</option>
                    <option value="Finances">Finances</option>
                    <option value="Tous">Tous</option>
                  </select>
                </div>
                <div>
                  <input
                    value={newUser.assignedKey}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, assignedKey: e.target.value }))}
                    placeholder="Clé assignée (décryptage)"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950/50 py-4 px-6 text-sm text-white"
                  />
                  <p className="mt-2 text-[9px] text-slate-500">Seule la clé assignée permet de déchiffrer les documents.</p>
                </div>
                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all"
                >
                  Créer le compte
                </button>
              </form>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8">
              <h3 className="text-sm font-black uppercase tracking-[0.3em] text-sky-400 mb-6">Comptes existants</h3>
              <div className="space-y-3">
                {users.map((account) => (
                  <div key={account.id} className="rounded-3xl border border-slate-700 p-4 bg-slate-950/40">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-black text-white">{account.name}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-[0.25em]">{account.role} • {account.service}</p>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">{account.username}</span>
                    </div>
                    <p className="mt-3 text-[10px] text-slate-400">{account.email}</p>
                    {account.assignedKey && (
                      <p className="mt-2 text-[10px] text-amber-300">Clé assignée : {account.assignedKey}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {lastCryptoStatus && (
            <div className={`mt-10 rounded-xl p-4 ${lastCryptoStatus.success ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-200' : 'bg-red-500/10 border border-red-500/30 text-red-200'}`}>
              {lastCryptoStatus.message}
            </div>
          )}
        </main>
      </div>
    );
  }

  return null;
}
