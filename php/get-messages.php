<?php
declare(strict_types=1);

require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/db.php';

global $config;

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Allow: GET');
    json_response(['success' => false, 'error' => 'Method not allowed.'], 405);
}

require_admin_json();

try {
    $limit = max(1, min(500, (int)($config['app']['admin_message_limit'] ?? 200)));
    $pdo = database();
    $stmt = $pdo->prepare(
        'SELECT id, name, message, created_at
         FROM birthday_messages
         ORDER BY created_at DESC, id DESC
         LIMIT :limit'
    );
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();

    json_response([
        'success' => true,
        'data' => $stmt->fetchAll(),
    ]);
} catch (Throwable $e) {
    error_log('Khushi Birthday get-messages failed: ' . $e->getMessage());
    json_response(['success' => false, 'error' => 'Messages could not be loaded right now.'], 503);
}
