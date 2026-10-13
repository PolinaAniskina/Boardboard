"""
Выдать роль admin пользователю.

Использование:
    python -m scripts.make_admin <username>
"""
import sys
from app.database import SessionLocal
from app.seed_roles import seed_roles, assign_admin_to_user


def main():
    if len(sys.argv) != 2:
        print("Usage: python -m scripts.make_admin <username>")
        sys.exit(1)

    username = sys.argv[1]
    db = SessionLocal()
    try:
        seed_roles(db)  # на всякий случай
        ok = assign_admin_to_user(db, username)
        if ok:
            print(f"✓ Пользователь {username} теперь admin")
        else:
            print(f"✗ Не удалось: пользователь {username} или роль admin не найдены")
            sys.exit(2)
    finally:
        db.close()


if __name__ == "__main__":
    main()