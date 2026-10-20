<?php
declare(strict_types=1);
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['success' => false, 'message' => 'GET method required.'], 405);
}

$applicationId = strtoupper(trim((string)($_GET['application_id'] ?? '')));

if ($applicationId === '') {
    json_response(['success' => false, 'message' => 'Application ID is required.'], 422);
}

try {
    $pdo = db();

    $stmt = $pdo->prepare(
        'SELECT a.application_id, s.name AS service_name, s.department, a.status, a.created_at
         FROM applications a
         INNER JOIN services s ON s.id = a.service_id
         WHERE a.application_id = :application_id
         LIMIT 1'
    );
    $stmt->execute(['application_id' => $applicationId]);
    $application = $stmt->fetch();

    if (!$application) {
        json_response(['success' => false, 'message' => 'Application ID was not found.'], 404);
    }

    $stmt = $pdo->prepare(
        'SELECT status, remarks, created_at
         FROM application_status_history
         WHERE application_id = (SELECT id FROM applications WHERE application_id = :application_id LIMIT 1)
         ORDER BY id ASC'
    );
    $stmt->execute(['application_id' => $applicationId]);

    $application['history'] = $stmt->fetchAll();

    json_response(['success' => true] + $application);
} catch (Throwable $e) {
    json_response(['success' => false, 'message' => 'Unable to retrieve application status.'], 500);
}
