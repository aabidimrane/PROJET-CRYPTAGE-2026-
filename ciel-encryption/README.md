# CIEL Encryption Application

A secure encryption and decryption web application for CIEL company, featuring multiple algorithms and role-based access control.

## Features

- **Multiple Encryption Algorithms**: AES-256, PBKDF2, Arcane-256
- **Role-Based Permissions**:
  - Admin: Full access to all features
  - User: Encrypt/decrypt files for their service
- **Password Storage**: Simulated KeePass integration for secure password management
- **Clean UI**: Built with Next.js and Tailwind CSS

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

## Usage

- **Login**: Use `admin/admin` for admin access or `user/user` for regular user access
- **Encrypt**: Select algorithm, enter text and password, encrypt
- **Decrypt**: Select algorithm, enter encrypted text and password, decrypt
- **Manage**: Admin only - view user management (simulated)

## Technologies

- Next.js 16
- TypeScript
- Tailwind CSS
- CryptoJS for encryption
- bcryptjs for password hashing
