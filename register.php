<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response([
        'success' => false,
        'message' => 'POST method required.'
    ], 405);
}

$data = json_input();

$name = trim((string)($data['full_name'] ?? ''));
$mobile = preg_replace('/\D+/', '', (string)($data['mobile'] ?? ''));
$email = trim((string)($data['email'] ?? ''));
$password = (string)($data['password'] ?? '');

/* Validation */

if ($name === '' || mb_strlen($name) < 2) {
    json_response([
        'success' => false,
        'message' => 'Please enter a valid full name.'
    ], 422);
}

if (!preg_match('/^[0-9]{10}$/', $mobile)) {
    json_response([
        'success' => false,
        'message' => 'Mobile number must contain 10 digits.'
    ], 422);
}

if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response([
        'success' => false,
        'message' => 'Please enter a valid email address.'
    ], 422);
}

if (strlen($password) < 6) {
    json_response([
        'success' => false,
        'message' => 'Password must be at least 6 characters.'
    ], 422);
}

try {

    $pdo = db();

    /* Check whether mobile/email already exists */

    if ($email !== '') {

        $stmt = $pdo->prepare(
            'SELECT id
             FROM users
             WHERE mobile = :mobile OR email = :email
             LIMIT 1'
        );

        $stmt->execute([
            'mobile' => $mobile,
            'email' => $email
        ]);

    } else {

        $stmt = $pdo->prepare(
            'SELECT id
             FROM users
             WHERE mobile = :mobile
             LIMIT 1'
        );

        $stmt->execute([
            'mobile' => $mobile
        ]);
    }

    if ($stmt->fetch()) {
        json_response([
            'success' => false,
            'message' => 'An account with this mobile/email already exists.'
        ], 409);
    }

    /* Hash password */

    $hash = password_hash($password, PASSWORD_DEFAULT);

    /* Insert user */

    $stmt = $pdo->prepare(
        'INSERT INTO users
        (full_name, mobile, email, password_hash)
        VALUES
        (:full_name, :mobile, :email, :password_hash)'
    );

    $stmt->execute([
        'full_name' => $name,
        'mobile' => $mobile,
        'email' => $email !== '' ? $email : null,
        'password_hash' => $hash
    ]);

    json_response([
        'success' => true,
        'message' => 'Registration successful. You can now login.'
    ], 201);

} catch (Throwable $e) {

    /* Temporary debugging message */
    json_response([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ], 500);
}