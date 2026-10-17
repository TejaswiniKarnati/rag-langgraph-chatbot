# Enterprise Application Security, Authentication & Session Architecture

## 1. Modern Authentication Principles
Secure web applications require robust user identity verification. The fundamental tenets include:
- **Cryptographic Password Hashing**: Passwords must never be stored in plaintext. Use salted hashes such as SHA-256 with unique cryptographically random salts per user, or adaptive algorithms like Argon2, bcrypt, and PBKDF2.
- **Salt Generation**: Unique cryptographic salts prevent pre-computed Rainbow Table attacks and ensure two users with the same password have different stored hashes.

## 2. Session Management and Token Auth
- **Bearer Tokens**: Cryptographically random session identifiers passed in the HTTP Authorization header (`Authorization: Bearer <token>`).
- **Session Expiration**: Tokens must have a deterministic Time-To-Live (TTL) to mitigate risk in case of token leakage.
- **Cross-Origin Resource Sharing (CORS)**: API servers must configure CORS middleware to restrict which origins (domains/ports) are permitted to submit requests and credentials.

## 3. Role-Based Access Control (RBAC)
User permissions are structured into roles:
- **Member / Researcher**: Standard permission to upload personal study documents, query the RAG pipeline, and inspect citations.
- **Administrator**: Full privileges to inspect server health, manage user accounts, and clear or rebuild vector database indices.
