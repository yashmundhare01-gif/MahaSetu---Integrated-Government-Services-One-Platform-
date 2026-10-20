<?php
declare(strict_types=1);
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'message' => 'POST method required.'], 405);
}

$userId = require_login();
$data = json_input();

$serviceId = (int)($data['service_id'] ?? 0);
$name = trim((string)($data['applicant_name'] ?? ''));
$mobile = preg_replace('/\D+/', '', (string)($data['mobile'] ?? ''));
$email = trim((string)($data['email'] ?? ''));
$details = trim((string)($data['details'] ?? ''));

if ($serviceId <= 0) {
    json_response(['success' => false, 'message' => 'Invalid service.'], 422);
}
if ($name === '' || mb_strlen($name) < 2) {
    json_response(['success' => false, 'message' => 'Applicant name is required.'], 422);
}
if (!preg_match('/^[0-9]{10}$/', $mobile)) {
    json_response(['success' => false, 'message' => 'Mobile number must contain 10 digits.'], 422);
}
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(['success' => false, 'message' => 'Invalid email address.'], 422);
}

try {
    $pdo = db();

    $stmt = $pdo->prepare('SELECT id, name, department_code FROM services WHERE id = :id AND active = 1 LIMIT 1');
    $stmt->execute(['id' => $serviceId]);
    $service = $stmt->fetch();

    if (!$service) {
        json_response(['success' => false, 'message' => 'Service not found.'], 404);
    }

    $year = date('Y');
    $prefix = 'MH-' . $service['department_code'] . '-' . $year . '-';

    for ($attempt = 0; $attempt < 5; $attempt++) {
        $applicationId = $prefix . str_pad((string)random_int(1, 999999), 6, '0', STR_PAD_LEFT);

        try {
            $pdo->beginTransaction();

            $stmt = $pdo->prepare(
                'INSERT INTO applications
                (application_id, user_id, service_id, applicant_name, mobile, email, details, status)
                VALUES (:application_id, :user_id, :service_id, :applicant_name, :mobile, :email, :details, "Submitted")'
            );
            $stmt->execute([
                'application_id' => $applicationId,
                'user_id' => $userId,
                'service_id' => $serviceId,
                'applicant_name' => $name,
                'mobile' => $mobile,
                'email' => $email !== '' ? $email : null,
                'details' => $details !== '' ? $details : null,
            ]);

            $applicationDbId = (int)$pdo->lastInsertId();

            $stmt = $pdo->prepare(
                'INSERT INTO application_status_history (application_id, status, remarks)
                 VALUES (:application_id, "Submitted", "Application submitted successfully.")'
            );
            $stmt->execute(['application_id' => $applicationDbId]);

            $pdo->commit();

            json_response([
                'success' => true,
                'message' => 'Application submitted successfully.',
                'application_id' => $applicationId
            ], 201);
        } catch (PDOException $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }

            if ((int)$e->errorInfo[1] === 1062) {
                continue;
            }

            throw $e;
        }
    }

    json_response(['success' => false, 'message' => 'Could not generate a unique application ID.'], 500);
} catch (Throwable $e) {
    json_response(['success' => false, 'message' => 'Application submission failed.'], 500);
}
