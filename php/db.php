<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli' && realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) {
    http_response_code(404);
    exit;
}

/** @var array<string, mixed> $config */
$config = require __DIR__ . '/config.php';

function database(): PDO
{
    global $config;
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $db = $config['db'] ?? [];
    $host = $db['host'] ?? null;
    $name = $db['name'] ?? null;
    $user = $db['user'] ?? null;
    $pass = $db['pass'] ?? null;
    $charset = $db['charset'] ?? 'utf8mb4';

    if (!is_string($host) || !is_string($name) || !is_string($user) || !is_string($pass) || !is_string($charset) || $user === '') {
        throw new RuntimeException('Database configuration is incomplete.');
    }

    if (!in_array('mysql', PDO::getAvailableDrivers(), true)) {
        throw new RuntimeException('PDO MySQL driver is not available.');
    }

    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=%s', $host, $name, $charset);

    try {
        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_STRINGIFY_FETCHES => false,
        ]);
    } catch (Throwable $e) {
        error_log('Khushi Birthday database connection failed: ' . $e->getMessage());
        throw new RuntimeException('Database connection failed.', 0, $e);
    }

    return $pdo;
}
