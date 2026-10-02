<?php
declare(strict_types=1);

ini_set('display_errors', '0');
ini_set('log_errors', '1');

/** @var array<string, mixed> $config */
$config = require __DIR__ . '/config.php';

function is_https_request(): bool
{
    global $config;

    if (!empty($config['app']['force_secure_cookie'])) {
        return true;
    }

    return !empty($_SERVER['HTTPS']) && strtolower((string)$_SERVER['HTTPS']) !== 'off';
}

function apply_security_headers(): void
{
    if (headers_sent()) {
        return;
    }

    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('X-Frame-Options: SAMEORIGIN');
    header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
    header('Cross-Origin-Opener-Policy: same-origin');
    header('Cross-Origin-Resource-Policy: same-origin');
    header('X-Permitted-Cross-Domain-Policies: none');
    header("Content-Security-Policy: default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; object-src 'none'; img-src 'self' data: blob:; media-src 'self'; connect-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com");
}

function start_secure_session(): void
{
    global $config;

    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.use_trans_sid', '0');
    ini_set('session.cookie_httponly', '1');
    ini_set('session.cookie_samesite', 'Lax');

    session_name((string)($config['app']['session_name'] ?? 'khushi_birthday_session'));
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => is_https_request(),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);

    session_start();
}

start_secure_session();
apply_security_headers();

function json_response(array $payload, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');

    $json = json_encode(
        $payload,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE
    );

    echo $json === false ? '{"success":false,"error":"Response encoding failed."}' : $json;
    exit;
}

function request_payload(): array
{
    $contentType = strtolower((string)($_SERVER['CONTENT_TYPE'] ?? ''));

    if (str_contains($contentType, 'application/json')) {
        $raw = file_get_contents('php://input');
        if (!is_string($raw) || trim($raw) === '') {
            return [];
        }

        $decoded = json_decode($raw, true, 32, JSON_THROW_ON_ERROR);
        return is_array($decoded) ? $decoded : [];
    }

    return is_array($_POST) ? $_POST : [];
}

function text_length(string $value): int
{
    if (function_exists('mb_strlen')) {
        return mb_strlen($value, 'UTF-8');
    }

    $count = preg_match_all('/./us', $value, $matches);
    return $count === false ? strlen($value) : $count;
}

function csrf_token(): string
{
    if (empty($_SESSION['csrf_token']) || !is_string($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }

    return (string)$_SESSION['csrf_token'];
}

function verify_csrf(?string $token): bool
{
    $stored = $_SESSION['csrf_token'] ?? '';
    if (!is_string($token) || !is_string($stored) || $stored === '' || $token === '') {
        return false;
    }

    return strlen($token) <= 128 && hash_equals($stored, $token);
}

function request_csrf_token(array $payload = []): ?string
{
    $header = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;
    if (is_string($header) && $header !== '') {
        return $header;
    }

    $body = $payload['csrf'] ?? null;
    return is_string($body) ? $body : null;
}

function is_admin_authenticated(): bool
{
    return ($_SESSION['admin_authenticated'] ?? false) === true
        && ($_SESSION['admin_username'] ?? '') !== '';
}

function require_admin_json(): void
{
    if (!is_admin_authenticated()) {
        json_response(['success' => false, 'error' => 'Authentication required.'], 401);
    }
}

function require_admin_page(): void
{
    if (!is_admin_authenticated()) {
        header('Location: login.php', true, 303);
        exit;
    }
}

function admin_credentials_configured(): bool
{
    global $config;

    $username = $config['admin']['username'] ?? '';
    $hash = $config['admin']['password_hash'] ?? '';

    return is_string($username)
        && $username !== ''
        && is_string($hash)
        && password_get_info($hash)['algo'] !== 0;
}

function login_rate_limit_path(): string
{
    global $config;

    $ip = (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    $secret = (string)($config['admin']['password_hash'] ?? 'khushi-birthday-rate-limit');
    $key = hash_hmac('sha256', $ip, $secret !== '' ? $secret : 'khushi-birthday-rate-limit');

    return rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR)
        . DIRECTORY_SEPARATOR
        . 'khushi_birthday_login_' . $key . '.json';
}

function read_login_rate_state(): array
{
    global $config;

    $path = login_rate_limit_path();
    if (!is_file($path)) {
        return ['attempts' => 0, 'window_started' => 0];
    }

    $raw = @file_get_contents($path);
    if (!is_string($raw) || $raw === '') {
        return ['attempts' => 0, 'window_started' => 0];
    }

    $state = json_decode($raw, true);
    if (!is_array($state)) {
        return ['attempts' => 0, 'window_started' => 0];
    }

    $windowSeconds = max(60, (int)($config['app']['login_window_seconds'] ?? 900));
    $windowStarted = (int)($state['window_started'] ?? 0);
    $attempts = max(0, (int)($state['attempts'] ?? 0));

    if ($windowStarted <= 0 || (time() - $windowStarted) >= $windowSeconds) {
        @unlink($path);
        return ['attempts' => 0, 'window_started' => 0];
    }

    return ['attempts' => $attempts, 'window_started' => $windowStarted];
}

function login_is_rate_limited(): bool
{
    global $config;

    $state = read_login_rate_state();
    $maxAttempts = max(1, (int)($config['app']['login_max_attempts'] ?? 5));

    return $state['attempts'] >= $maxAttempts;
}

function record_login_failure(): void
{
    global $config;

    $path = login_rate_limit_path();
    $windowSeconds = max(60, (int)($config['app']['login_window_seconds'] ?? 900));
    $now = time();
    $handle = @fopen($path, 'c+');

    if ($handle === false) {
        return;
    }

    try {
        if (!flock($handle, LOCK_EX)) {
            return;
        }

        $raw = stream_get_contents($handle);
        $state = is_string($raw) ? json_decode($raw, true) : null;
        if (!is_array($state) || ($now - (int)($state['window_started'] ?? 0)) >= $windowSeconds) {
            $state = ['attempts' => 0, 'window_started' => $now];
        }

        $state['attempts'] = (int)$state['attempts'] + 1;
        ftruncate($handle, 0);
        rewind($handle);
        fwrite($handle, json_encode($state, JSON_UNESCAPED_SLASHES));
        fflush($handle);
        @chmod($path, 0600);
        flock($handle, LOCK_UN);
    } finally {
        fclose($handle);
    }
}

function clear_login_failures(): void
{
    unset($_SESSION['login_attempts'], $_SESSION['login_window_started']);
    @unlink(login_rate_limit_path());
}

function scalar_text(mixed $value): ?string
{
    return is_string($value) ? $value : null;
}

/* Public same-origin endpoint used by the birthday message form. */
if (basename((string)($_SERVER['SCRIPT_FILENAME'] ?? '')) === basename(__FILE__)) {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET' || ($_GET['action'] ?? '') !== 'csrf') {
        json_response(['success' => false, 'error' => 'Not found.'], 404);
    }

    json_response(['success' => true, 'csrf' => csrf_token()]);
}
