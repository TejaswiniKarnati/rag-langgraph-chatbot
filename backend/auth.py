import os
import json
import hashlib
import secrets
import time
from typing import Optional, Dict, Any

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
USERS_FILE = os.path.join(DATA_DIR, "users.json")

os.makedirs(DATA_DIR, exist_ok=True)

# In-memory active session tokens: token -> {user_id, username, expires_at}
_active_sessions: Dict[str, Dict[str, Any]] = {}
SESSION_TTL_SECONDS = 7 * 24 * 3600  # 7 days


def _hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    if not salt:
        salt = secrets.token_hex(16)
    hashed = hashlib.sha256((salt + password).encode("utf-8")).hexdigest()
    return hashed, salt


def _load_users() -> Dict[str, Dict[str, Any]]:
    if not os.path.exists(USERS_FILE):
        # Seed default users
        demo_hash, demo_salt = _hash_password("demo123", "demo_salt_constant")
        admin_hash, admin_salt = _hash_password("admin123", "admin_salt_constant")
        default_users = {
            "demo": {
                "id": "usr_demo_01",
                "username": "demo",
                "full_name": "Alex Demo",
                "role": "Researcher",
                "password_hash": demo_hash,
                "salt": demo_salt,
                "avatar": "🧑‍💻",
                "created_at": time.time()
            },
            "admin": {
                "id": "usr_admin_01",
                "username": "admin",
                "full_name": "Admin User",
                "role": "Administrator",
                "password_hash": admin_hash,
                "salt": admin_salt,
                "avatar": "⚡",
                "created_at": time.time()
            }
        }
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump(default_users, f, indent=2)
        return default_users

    try:
        with open(USERS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def _save_users(users: Dict[str, Dict[str, Any]]):
    with open(USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(users, f, indent=2)


def register_user(username: str, password: str, full_name: Optional[str] = None, avatar: Optional[str] = None) -> Dict[str, Any]:
    username = username.strip().lower()
    if not username or len(username) < 3:
        raise ValueError("Username must be at least 3 characters long.")
    if not password or len(password) < 4:
        raise ValueError("Password must be at least 4 characters long.")

    users = _load_users()
    if username in users:
        raise ValueError("Username already exists. Please choose another or log in.")

    pwd_hash, salt = _hash_password(password)
    user_id = f"usr_{secrets.token_hex(6)}"
    user_data = {
        "id": user_id,
        "username": username,
        "full_name": full_name.strip() if full_name else username.capitalize(),
        "role": "Member",
        "password_hash": pwd_hash,
        "salt": salt,
        "avatar": avatar or "✨",
        "created_at": time.time()
    }
    users[username] = user_data
    _save_users(users)

    # Automatically create session
    token = create_session(user_data)
    return {
        "token": token,
        "user": {
            "id": user_data["id"],
            "username": user_data["username"],
            "full_name": user_data["full_name"],
            "role": user_data["role"],
            "avatar": user_data["avatar"]
        }
    }


def authenticate_user(username: str, password: str) -> Dict[str, Any]:
    username = username.strip().lower()
    users = _load_users()
    if username not in users:
        raise ValueError("Invalid username or password.")

    user = users[username]
    expected_hash, _ = _hash_password(password, user["salt"])
    if expected_hash != user["password_hash"]:
        raise ValueError("Invalid username or password.")

    token = create_session(user)
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "full_name": user["full_name"],
            "role": user["role"],
            "avatar": user.get("avatar", "👤")
        }
    }


def create_session(user: Dict[str, Any]) -> str:
    token = f"sess_{secrets.token_urlsafe(32)}"
    _active_sessions[token] = {
        "id": user["id"],
        "username": user["username"],
        "full_name": user["full_name"],
        "role": user.get("role", "Member"),
        "avatar": user.get("avatar", "👤"),
        "expires_at": time.time() + SESSION_TTL_SECONDS
    }
    return token


def verify_session(token: str) -> Optional[Dict[str, Any]]:
    if not token:
        return None
    session = _active_sessions.get(token)
    if not session:
        return None
    if time.time() > session["expires_at"]:
        del _active_sessions[token]
        return None
    return {
        "id": session["id"],
        "username": session["username"],
        "full_name": session["full_name"],
        "role": session["role"],
        "avatar": session["avatar"]
    }


def destroy_session(token: str) -> bool:
    if token in _active_sessions:
        del _active_sessions[token]
        return True
    return False
