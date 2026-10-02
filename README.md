# Khushi Birthday — Production Integration Build

This build continues the existing cinematic birthday website and adds a senior-level integration, security, mobile and performance pass without changing the overall visual direction.

## Stack

- HTML5 / CSS3
- Vanilla JavaScript + Fetch API
- GSAP 3.12.5 via CDN, used only for enhancement
- PHP 8+
- MySQL / MariaDB
- PDO with native prepared statements
- Apache `.htaccess` security headers where supported

## Final structure

```text
khushi-birthday/
├── .htaccess
├── README.md
├── database.sql
├── index.html
├── memories.html
├── message.html
├── story.html
├── surprise.html
├── css/
│   ├── animations.css
│   ├── memories.css
│   ├── story.css
│   └── style.css
├── js/
│   ├── animations.js
│   ├── main.js
│   ├── memories.js
│   ├── story.js
│   └── surprise.js
├── images/memories/
│   └── .gitkeep
├── music/
│   └── .gitkeep
├── php/
│   ├── auth.php
│   ├── config.php
│   ├── config.php.example
│   ├── db.php
│   ├── delete-message.php
│   ├── get-messages.php
│   └── save-message.php
└── admin/
    ├── login.php
    ├── dashboard.php
    ├── logout.php
    ├── css/admin.css
    └── js/admin.js
```

## Integration and UX fixes

- Preserved the existing cinematic design, navigation, memory lightbox, timeline, surprise sequence and music player.
- Removed the unnecessary infinite GSAP hero loop; GSAP now provides a one-time entrance plus desktop card interaction.
- Scroll reveals use IntersectionObserver and reduced-motion fallbacks.
- Countdown stops its interval once the target is reached.
- Message form uses Fetch API with request timeout, CSRF bootstrap, client/server length validation, loading state and success/error feedback.
- Story expansion has proper ARIA relationships.
- Lightbox supports keyboard navigation, touch swipe, focus return and focus containment.
- Surprise overlay behaves as a dialog and keeps the interaction touch-friendly.
- Gallery images use lazy loading and async decoding; placeholder images remain intentionally absent until real files are added.
- Horizontal overflow is prevented across the public experience; 360–430px Android layouts are treated as a primary target.

## Security hardening

- PDO native prepared statements; no interpolated user data in SQL.
- Server-side type validation and length limits.
- CSRF protection for message submission, admin login and message deletion/logout.
- Strict session mode, HTTP-only cookies, SameSite=Lax and secure-cookie support for HTTPS deployments.
- Session ID regeneration after successful admin login.
- Server-side IP-based login throttling for repeated failed attempts, with a short-lived locked rate bucket in the system temp directory.
- Admin APIs require an authenticated session.
- Admin messages are rendered with DOM `textContent`, not HTML injection.
- Generic production error messages; database exception details are sent only to the server error log.
- Security headers and a restrictive Content Security Policy are set by the root `.htaccess`; PHP endpoints also set defensive headers for non-Apache hosting. PHP runtime/admin responses are marked `noindex`.
- Database credentials and the admin password hash are not stored in frontend code or a default credential block.

## Configuration

Set these server-side environment variables:

```text
KHUSHI_DB_HOST=127.0.0.1
KHUSHI_DB_NAME=khushi_birthday
KHUSHI_DB_USER=your_mysql_user
KHUSHI_DB_PASS=your_mysql_password
KHUSHI_ADMIN_USERNAME=your_admin_username
KHUSHI_ADMIN_PASSWORD_HASH=your_password_hash
KHUSHI_FORCE_SECURE_COOKIE=1   # use 1 on HTTPS production; 0 is fine for local HTTP
```

Generate a password hash with PHP. Use your own password; no default password is included in the project:

```bash
php -r "echo password_hash('YOUR_PASSWORD', PASSWORD_DEFAULT), PHP_EOL;"
```

`php/config.php.example` contains the variable names as a reference.

## Database setup

Import `database.sql` into MySQL or MariaDB. It creates the `khushi_birthday` database and `birthday_messages` table using `utf8mb4`, with a timestamp/index suitable for the admin inbox.

## Local PHP + MySQL setup

1. Install PHP 8+ with the `pdo_mysql` extension and MySQL/MariaDB.
2. Import `database.sql`.
3. Export the environment variables above for the PHP process.
4. Start the project from its root with:

```bash
php -S 127.0.0.1:8000 -t .
```

5. Open `http://127.0.0.1:8000/` for the public site.
6. Open `http://127.0.0.1:8000/admin/login.php` for the private admin panel.

PHP's built-in server does not process Apache `.htaccess`. For production, Apache/Nginx should enforce equivalent security headers and deny access to runtime configuration files. Behind a TLS-terminating reverse proxy, keep `KHUSHI_FORCE_SECURE_COOKIE=1`; the application intentionally does not trust an arbitrary client-supplied `X-Forwarded-Proto` header.

## Personal media

Add real assets only when ready:

```text
images/memories/photo-01.jpg
images/memories/photo-02.jpg
images/memories/photo-03.jpg
images/memories/photo-04.jpg
music/birthday.mp3
```

The project does not fabricate personal photographs or audio.
