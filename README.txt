NEXUS AI Gmail integration update

Files:
- app.py: updated Flask app with Gmail OAuth and summarization routes
- database.py: adds per-user Gmail credential storage table and helper functions
- index.html: adds Connect Gmail, Summarize Recent Emails, and Disconnect Gmail controls

Before replacing files:
1. Back up your current app.py, database.py, and templates/index.html.
2. Copy these updated files into your project:
   app.py -> project root/app.py
   database.py -> project root/database.py
   index.html -> project root/templates/index.html
3. Keep your existing static/style.css, static/script.js, login.html, signup.html, .env, and nova_ai.db.
4. Add these lines to your existing .env (do not remove existing keys):
   GOOGLE_CLIENT_ID=your_actual_client_id
   GOOGLE_CLIENT_SECRET=your_actual_client_secret
   GOOGLE_REDIRECT_URI=http://127.0.0.1:5000/google/callback
5. In Google Cloud, the OAuth Web application must have this exact Authorized redirect URI:
   http://127.0.0.1:5000/google/callback
6. Ensure .env is in .gitignore. Never commit OAuth secrets or tokens.
7. Start the app using the same command you normally use and sign in with your existing NEXUS AI account.
8. Click Connect Gmail, approve read-only Gmail access, then click Summarize Recent Emails.

Behavior:
- Summarizes up to 10 emails from the last 14 days.
- Requests gmail.readonly only; it does not send, modify, or delete emails.
- Gmail credentials are stored per NEXUS AI user in SQLite. For public/production deployment, encrypt stored tokens at rest and use HTTPS with a production redirect URI.
- This update adds Gmail connection and summarization. It does not yet add Google as a replacement login method; the existing email/password login is preserved.
- Chat accepts up to 5 PNG, JPG, WEBP, PDF, TXT, MD, or CSV attachments per message, with a 10 MB combined file limit. Files are sent to Gemini for analysis and their contents are not stored in the conversation database.
