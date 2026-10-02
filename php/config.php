<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli' && realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) {
    http_response_code(404);
    exit;
}

/*
 * Runtime-only configuration.
 * Keep real secrets in environment variables supplied by the hosting environment.
 */

$env = static function (string $key, string $default = ''): string {
    $value = getenv($key);
    return $value === false ? $default : trim((string)$value);
};

return [
    'db' => [
        'host' => $env('KHUSHI_DB_HOST', '127.0.0.1'),
        'name' => $env('KHUSHI_DB_NAME', 'khushi_birthday'),
        'user' => $env('KHUSHI_DB_USER'),
        'pass' => getenv('KHUSHI_DB_PASS') === false ? '' : (string)getenv('KHUSHI_DB_PASS'),
        'charset' => 'utf8mb4',
    ],
    'admin' => [
        'username' => $env('KHUSHI_ADMIN_USERNAME'),
        'password_hash' => getenv('KHUSHI_ADMIN_PASSWORD_HASH') === false ? '' : (string)getenv('KHUSHI_ADMIN_PASSWORD_HASH'),
    ],
    'app' => [
        'session_name' => 'khushi_birthday_session',
        'force_secure_cookie' => $env('KHUSHI_FORCE_SECURE_COOKIE', '0') === '1',
        'message_name_max' => 80,
        'message_body_max' => 3000,
        'admin_message_limit' => 200,
        'login_max_attempts' => 5,
        'login_window_seconds' => 900,
    ],
];
