<?php
declare(strict_types=1);
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['success' => false, 'message' => 'GET method required.'], 405);
}

try {
    $services = db()->query(
        'SELECT id, name, department, description FROM services WHERE active = 1 ORDER BY id'
    )->fetchAll();

    json_response(['success' => true, 'services' => $services]);
} catch (Throwable $e) {
    json_response(['success' => false, 'message' => 'Unable to load services.'], 500);
}
