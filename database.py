import sqlite3

DATABASE = "nova_ai.db"


def get_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Conversations table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id)
                REFERENCES users(id)
                ON DELETE CASCADE
        )
    """)

    # Messages table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id INTEGER NOT NULL,
            role TEXT NOT NULL,
            text TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (conversation_id)
                REFERENCES conversations(id)
                ON DELETE CASCADE
        )
    """)

    # Gmail OAuth credentials, kept separately for each Nova AI user.
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS gmail_tokens (
            user_id INTEGER PRIMARY KEY,
            credentials_json TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)

    conn.commit()
    conn.close()


def create_user(username, email, password_hash):
    conn = get_connection()

    try:
        cursor = conn.execute(
            """
            INSERT INTO users (username, email, password_hash)
            VALUES (?, ?, ?)
            """,
            (username, email, password_hash)
        )

        conn.commit()
        return cursor.lastrowid

    finally:
        conn.close()


def get_user_by_email(email):
    conn = get_connection()

    try:
        return conn.execute(
            "SELECT * FROM users WHERE email = ?",
            (email,)
        ).fetchone()

    finally:
        conn.close()


def create_conversation(user_id, title):
    conn = get_connection()

    try:
        cursor = conn.execute(
            """
            INSERT INTO conversations (user_id, title)
            VALUES (?, ?)
            """,
            (user_id, title)
        )

        conn.commit()
        return cursor.lastrowid

    finally:
        conn.close()


def save_message(conversation_id, role, text):
    conn = get_connection()

    try:
        conn.execute(
            """
            INSERT INTO messages (conversation_id, role, text)
            VALUES (?, ?, ?)
            """,
            (conversation_id, role, text)
        )

        conn.commit()

    finally:
        conn.close()


def get_conversations(user_id):
    conn = get_connection()

    try:
        return conn.execute(
            """
            SELECT id, title, created_at
            FROM conversations
            WHERE user_id = ?
            ORDER BY created_at DESC, id DESC
            """,
            (user_id,)
        ).fetchall()

    finally:
        conn.close()


def get_messages(conversation_id):
    conn = get_connection()

    try:
        return conn.execute(
            """
            SELECT role, text, created_at
            FROM messages
            WHERE conversation_id = ?
            ORDER BY id ASC
            """,
            (conversation_id,)
        ).fetchall()

    finally:
        conn.close()


def get_conversation(conversation_id, user_id):
    conn = get_connection()

    try:
        return conn.execute(
            """
            SELECT id, title
            FROM conversations
            WHERE id = ? AND user_id = ?
            """,
            (conversation_id, user_id)
        ).fetchone()

    finally:
        conn.close()


def delete_conversation_record(conversation_id, user_id):
    conn = get_connection()

    try:
        cursor = conn.execute(
            """
            DELETE FROM conversations
            WHERE id = ? AND user_id = ?
            """,
            (conversation_id, user_id)
        )

        conn.commit()
        return cursor.rowcount > 0

    finally:
        conn.close()


def rename_conversation(conversation_id, user_id, new_title):
    conn = get_connection()

    try:
        cursor = conn.execute(
            """
            UPDATE conversations
            SET title = ?
            WHERE id = ? AND user_id = ?
            """,
            (new_title, conversation_id, user_id)
        )

        conn.commit()
        return cursor.rowcount > 0

    finally:
        conn.close()

def save_gmail_credentials(user_id, credentials_json):
    conn = get_connection()
    try:
        conn.execute(
            """
            INSERT INTO gmail_tokens (user_id, credentials_json, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id) DO UPDATE SET
                credentials_json = excluded.credentials_json,
                updated_at = CURRENT_TIMESTAMP
            """,
            (user_id, credentials_json),
        )
        conn.commit()
    finally:
        conn.close()


def get_gmail_credentials(user_id):
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT credentials_json FROM gmail_tokens WHERE user_id = ?",
            (user_id,),
        ).fetchone()
        return row["credentials_json"] if row else None
    finally:
        conn.close()


def delete_gmail_credentials(user_id):
    conn = get_connection()
    try:
        conn.execute("DELETE FROM gmail_tokens WHERE user_id = ?", (user_id,))
        conn.commit()
    finally:
        conn.close()
