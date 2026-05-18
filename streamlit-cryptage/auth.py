import bcrypt
from typing import Dict, Optional

ACCESS_LEVELS = ["vert", "orange", "rouge"]
ADMIN_ROLE = "admin"
USER_ROLE = "user"

# Default users for démonstration. L'admin peut ajuster les niveaux.
DEFAULT_USERS: Dict[str, Dict] = {
    "admin": {
        "password_hash": bcrypt.hashpw("admin".encode("utf-8"), bcrypt.gensalt()),
        "role": ADMIN_ROLE,
        "level": "rouge",
    },
    "alice": {
        "password_hash": bcrypt.hashpw("alice".encode("utf-8"), bcrypt.gensalt()),
        "role": USER_ROLE,
        "level": "orange",
    },
    "bob": {
        "password_hash": bcrypt.hashpw("bob".encode("utf-8"), bcrypt.gensalt()),
        "role": USER_ROLE,
        "level": "vert",
    },
}

USERS = DEFAULT_USERS.copy()


def authenticate(username: str, password: str) -> Optional[Dict]:
    user = USERS.get(username)
    if not user:
        return None
    if bcrypt.checkpw(password.encode("utf-8"), user["password_hash"]):
        return {"username": username, "role": user["role"], "level": user["level"]}
    return None


def is_admin(user: Dict) -> bool:
    return user.get("role") == ADMIN_ROLE


def list_users() -> Dict[str, Dict]:
    return {username: {"role": info["role"], "level": info["level"]} for username, info in USERS.items()}


def update_user_level(username: str, new_level: str) -> bool:
    if username in USERS and new_level in ACCESS_LEVELS:
        USERS[username]["level"] = new_level
        return True
    return False


def add_user(username: str, password: str, role: str = USER_ROLE, level: str = "vert") -> bool:
    if username in USERS or role not in [ADMIN_ROLE, USER_ROLE] or level not in ACCESS_LEVELS:
        return False
    USERS[username] = {
        "password_hash": bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()),
        "role": role,
        "level": level,
    }
    return True
