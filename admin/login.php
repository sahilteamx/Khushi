<?php
declare(strict_types=1);
require_once __DIR__ . '/../php/auth.php';

global $config;

if (is_admin_authenticated()) {
    header('Location: dashboard.php', true, 303);
    exit;
}

$error = null;
$configured = admin_credentials_configured();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!verify_csrf($_POST['csrf'] ?? null)) {
        $error = 'Invalid request. Please try again.';
    } elseif (login_is_rate_limited()) {
        $error = 'Too many unsuccessful attempts. Please try again later.';
    } elseif (!$configured) {
        $error = 'Admin access is not configured on this server.';
    } else {
        $usernameInput = $_POST['username'] ?? null;
        $passwordInput = $_POST['password'] ?? null;
        $username = is_string($usernameInput) ? trim($usernameInput) : '';
        $password = is_string($passwordInput) ? $passwordInput : '';
        $configuredUsername = (string)$config['admin']['username'];
        $passwordHash = (string)$config['admin']['password_hash'];

        $validUser = $username !== '' && text_length($username) <= 80 && hash_equals($configuredUsername, $username);
        $validPassword = $password !== '' && password_verify($password, $passwordHash);

        if ($validUser && $validPassword) {
            session_regenerate_id(true);
            clear_login_failures();
            $_SESSION = [
                'admin_authenticated' => true,
                'admin_username' => $username,
                'csrf_token' => bin2hex(random_bytes(32)),
            ];
            header('Location: dashboard.php', true, 303);
            exit;
        }

        record_login_failure();
        usleep(150000);
        $error = 'Invalid credentials.';
    }
}
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#08090d">
<title>Admin Login · Khushi</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/admin.css">
</head>
<body class="admin-shell admin-login-shell">
<main class="admin-card">
  <div class="admin-card-top"><span class="admin-kicker">Khushi Birthday</span><span class="admin-lock" aria-hidden="true">Private</span></div>
  <h1>Admin access</h1>
  <p class="admin-intro">Manage birthday messages from this private dashboard.</p>
  <?php if ($error !== null): ?>
    <p class="admin-error" role="alert"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></p>
  <?php endif; ?>
  <form method="post" novalidate autocomplete="on">
    <input type="hidden" name="csrf" value="<?= htmlspecialchars(csrf_token(), ENT_QUOTES, 'UTF-8') ?>">
    <label for="adminUsername">Username<input id="adminUsername" name="username" autocomplete="username" maxlength="80" required></label>
    <label for="adminPassword">Password<input id="adminPassword" type="password" name="password" autocomplete="current-password" required></label>
    <button class="admin-button" type="submit">Sign in</button>
  </form>
  <a class="admin-back" href="../index.html">← Back to website</a>
</main>
</body>
</html>
