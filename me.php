<?php
declare(strict_types=1);
require_once __DIR__ . '/db.php';

start_app_session();

if (empty($_SESSION['user_id'])) {
    json_response(['success' => true, 'user' => null]);
}

try {
    $stmt = db()->prepare('SELECT id, full_name, mobile, email FROM users WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => (int)$_SESSION['user_id']]);
    $user = $stmt->fetch();

    if (!$user) {
        $_SESSION = [];
        json_response(['success' => true, 'user' => null]);
    }

    json_response(['success' => true, 'user' => $user]);
} catch (Throwable $e) {
    json_response(['success' => false, 'message' => 'Unable to check session.'], 500);
}
