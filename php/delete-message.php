<?php
declare(strict_types=1);

require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    json_response(['success' => false, 'error' => 'Method not allowed.'], 405);
}

require_admin_json();

try {
    $payload = request_payload();
} catch (JsonException) {
    json_response(['success' => false, 'error' => 'Invalid request data.'], 400);
}

if (!verify_csrf(request_csrf_token($payload))) {
    json_response(['success' => false, 'error' => 'Invalid or expired request token.'], 403);
}

$idValue = $payload['id'] ?? null;
$id = filter_var($idValue, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);

if ($id === false || $id === null) {
    json_response(['success' => false, 'error' => 'A valid message id is required.'], 422);
}

try {
    $pdo = database();
    $stmt = $pdo->prepare('DELETE FROM birthday_messages WHERE id = :id');
    $stmt->execute([':id' => $id]);

    if ($stmt->rowCount() !== 1) {
        json_response(['success' => false, 'error' => 'Message not found.'], 404);
    }

    json_response(['success' => true, 'message' => 'Message deleted.']);
} catch (Throwable $e) {
    error_log('Khushi Birthday delete-message failed: ' . $e->getMessage());
    json_response(['success' => false, 'error' => 'The message could not be deleted right now.'], 503);
}
