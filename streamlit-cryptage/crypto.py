import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend

HEADER = b"CIELCRYPT"
LEVEL_FIELD_SIZE = 6
SALT_SIZE = 16
NONCE_SIZE = 12


def _get_level_parameters(level: str) -> dict:
    if level == "vert":
        return {"iterations": 100_000, "associated": b"CIEL-VERTE"}
    if level == "orange":
        return {"iterations": 200_000, "associated": b"CIEL-ORANGE"}
    return {"iterations": 300_000, "associated": b"CIEL-ROUGE"}


def _derive_key(password: str, salt: bytes, iterations: int) -> bytes:
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=iterations,
        backend=default_backend(),
    )
    return kdf.derive(password.encode("utf-8"))


def encrypt_file(file_bytes: bytes, password: str, level: str) -> bytes:
    params = _get_level_parameters(level)
    salt = os.urandom(SALT_SIZE)
    key = _derive_key(password, salt, params["iterations"])
    aesgcm = AESGCM(key)
    nonce = os.urandom(NONCE_SIZE)
    ciphertext = aesgcm.encrypt(nonce, file_bytes, params["associated"])

    level_field = level.encode("utf-8").ljust(LEVEL_FIELD_SIZE, b"\x00")
    return HEADER + level_field + salt + nonce + ciphertext


def decrypt_file(package_bytes: bytes, password: str) -> bytes:
    if not package_bytes.startswith(HEADER):
        raise ValueError("Fichier chiffré invalide.")

    offset = len(HEADER)
    level_bytes = package_bytes[offset:offset + LEVEL_FIELD_SIZE].rstrip(b"\x00")
    level = level_bytes.decode("utf-8")
    offset += LEVEL_FIELD_SIZE
    salt = package_bytes[offset:offset + SALT_SIZE]
    offset += SALT_SIZE
    nonce = package_bytes[offset:offset + NONCE_SIZE]
    offset += NONCE_SIZE
    ciphertext = package_bytes[offset:]

    params = _get_level_parameters(level)
    key = _derive_key(password, salt, params["iterations"])
    aesgcm = AESGCM(key)
    return aesgcm.decrypt(nonce, ciphertext, params["associated"])


def access_level_description(level: str) -> str:
    descriptions = {
        "vert": "Accès basique : chiffrement AES sécurisé pour fichiers légers.",
        "orange": "Accès intermédiaire : chiffrement renforcé avec PBKDF2 + AES-GCM.",
        "rouge": "Haute sécurité : niveau maximal avec clé renforcée et authentification.",
    }
    return descriptions.get(level, "Niveau inconnu.")
