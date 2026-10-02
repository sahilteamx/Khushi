<?php
declare(strict_types=1);

require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/db.php';

global $config;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    json_response(['success' => false, 'error' => 'Method not allowed.'], 405);
}

$contentLength = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($contentLength > 65536) {
    json_response(['success' => false, 'error' => 'Request is too large.'], 413);
}

try {
    $payload = request_payload();
} catch (JsonException) {
    json_response(['success' => false, 'error' => 'Invalid request data.'], 400);
}

if (!verify_csrf(request_csrf_token($payload))) {
    json_response(['success' => false, 'error' => 'Invalid or expired request token.'], 403);
}

$name = scalar_text($payload['name'] ?? null);
$message = scalar_text($payload['message'] ?? null);

if ($name === null || $message === null) {
    json_response(['success' => false, 'error' => 'Name and message are required.'], 422);
}

$name = trim($name);
$message = trim($message);
$nameMax = max(1, (int)($config['app']['message_name_max'] ?? 80));
$messageMax = max(1, (int)($config['app']['message_body_max'] ?? 3000));

if ($name === '' || text_length($name) > $nameMax || preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', $name)) {
    json_response(['success' => false, 'error' => "Name must be between 1 and {$nameMax} characters."], 422);
}

if ($message === '' || text_length($message) > $messageMax || str_contains($message, "\0")) {
    json_response(['success' => false, 'error' => "Message must be between 1 and {$messageMax} characters."], 422);
}

try {
    $pdo = database();
    $stmt = $pdo->prepare(
        'INSERT INTO birthday_messages (name, message) VALUES (:name, :message)'
    );
    $stmt->execute([
        ':name' => $name,
        ':message' => $message,
    ]);

    json_response([
        'success' => true,
        'message' => 'Your birthday message was saved.',
        'data' => ['id' => (int)$pdo->lastInsertId()],
    ], 201);
} catch (Throwable $e) {
    error_log('Khushi Birthday save-message failed: ' . $e->getMessage());
    json_response(['success' => false, 'error' => 'The message could not be saved right now.'], 503);
}
