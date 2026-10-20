<?php
declare(strict_types=1);
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'message' => 'POST method required.'], 405);
}

$data = json_input();
$identifier = trim((string)($data['identifier'] ?? ''));
$password = (string)($data['password'] ?? '');

if ($identifier === '' || $password === '') {
    json_response(['success' => false, 'message' => 'Login details are required.'], 422);
}

try {
    $pdo = db();

    $stmt = $pdo->prepare(
        'SELECT id, full_name, mobile, email, password_hash FROM users
         WHERE mobile = :identifier OR email = :identifier
         LIMIT 1'
    );
    $stmt->execute(['identifier' => $identifier]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        json_response(['success' => false, 'message' => 'Invalid mobile/email or password.'], 401);
    }

    start_app_session();
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int)$user['id'];

    unset($user['password_hash']);

    json_response(['success' => true, 'user' => $user]);
} catch (Throwable $e) {
    json_response(['success' => false, 'message' => 'Login failed. Check the database setup.'], 500);
}
