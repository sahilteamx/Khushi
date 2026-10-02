<?php
declare(strict_types=1);
require_once __DIR__ . '/../php/auth.php';
require_admin_page();
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#08090d">
<meta name="csrf-token" content="<?= htmlspecialchars(csrf_token(), ENT_QUOTES, 'UTF-8') ?>">
<title>Dashboard · Khushi</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/admin.css">
<script src="js/admin.js" defer></script>
</head>
<body class="admin-shell admin-dashboard-shell">
<main class="admin-dashboard">
  <header class="admin-header">
    <div>
      <span class="admin-kicker">Khushi Birthday</span>
      <h1>Message dashboard</h1>
      <p class="admin-intro">Private messages submitted through the birthday website.</p>
    </div>
    <form method="post" action="logout.php" class="logout-form">
      <input type="hidden" name="csrf" value="<?= htmlspecialchars(csrf_token(), ENT_QUOTES, 'UTF-8') ?>">
      <button class="admin-link-button" type="submit">Sign out</button>
    </form>
  </header>

  <section class="admin-panel" aria-labelledby="messagesTitle">
    <div class="panel-heading">
      <div>
        <span class="panel-kicker">Inbox</span>
        <h2 id="messagesTitle">Birthday messages</h2>
      </div>
      <button class="admin-button admin-button--ghost" id="refreshMessages" type="button">Refresh</button>
    </div>
    <p class="admin-status" id="messagesStatus" role="status" aria-live="polite">Loading messages…</p>
    <div class="message-list" id="messageList" aria-live="polite" aria-busy="true"></div>
    <noscript><p class="admin-error">JavaScript is required to load the message inbox.</p></noscript>
  </section>

  <div class="dashboard-footer">
    <a class="admin-back" href="../index.html">← Open public website</a>
  </div>
</main>
</body>
</html>
