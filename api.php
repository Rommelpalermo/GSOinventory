<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

function respond(array $payload, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($payload);
    exit;
}

function requestData(): array
{
    $data = json_decode(file_get_contents('php://input'), true);
    return is_array($data) ? $data : $_POST;
}

try {
    $database = new PDO(
        'mysql:host=127.0.0.1;dbname=gsoinventory;charset=utf8mb4',
        'root',
        '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );

    $database->exec(
        'CREATE TABLE IF NOT EXISTS users (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(120) NOT NULL,
            employee_id VARCHAR(50) NULL UNIQUE,
            email VARCHAR(150) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            role ENUM("admin", "staff") NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );
    $database->exec(
        'CREATE TABLE IF NOT EXISTS inventory_items (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            item_name VARCHAR(150) NOT NULL,
            item_code VARCHAR(50) NOT NULL UNIQUE,
            location_name VARCHAR(150) NOT NULL,
            item_condition ENUM("excellent", "good", "fair") NOT NULL DEFAULT "good",
            quantity_total INT UNSIGNED NOT NULL,
            quantity_available INT UNSIGNED NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );

    $defaults = [
        ['mhel palermo', null, 'mhelpalermo90@gmail.com', 'dikoalam', 'admin'],
        ['Maria Santos', 'GSO-2026-001', 'maria.santos@trimex.edu.ph', 'dikoalam', 'staff'],
    ];
    $findUser = $database->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $addUser = $database->prepare('INSERT INTO users (name, employee_id, email, password_hash, role) VALUES (?, ?, ?, ?, ?)');
    foreach ($defaults as [$name, $employeeId, $email, $password, $role]) {
        $findUser->execute([$email]);
        if (!$findUser->fetch()) {
            $addUser->execute([$name, $employeeId, $email, password_hash($password, PASSWORD_DEFAULT), $role]);
        }
    }

    $action = $_GET['action'] ?? 'health';
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($action === 'health') {
        respond(['ok' => true, 'database' => 'gsoinventory']);
    }

    if ($action === 'login' && $method === 'POST') {
        $data = requestData();
        $identity = strtolower(trim((string)($data['identity'] ?? '')));
        $password = (string)($data['password'] ?? '');
        $query = $database->prepare('SELECT id, name, employee_id, email, password_hash, role FROM users WHERE LOWER(email) = ? OR LOWER(employee_id) = ? LIMIT 1');
        $query->execute([$identity, $identity]);
        $user = $query->fetch();
        if (!$user || !password_verify($password, $user['password_hash'])) {
            respond(['ok' => false, 'message' => 'Invalid account details or password.'], 401);
        }
        unset($user['password_hash']);
        respond(['ok' => true, 'user' => $user]);
    }

    if ($action === 'items' && $method === 'GET') {
        $items = $database->query('SELECT id, item_name, item_code, location_name, item_condition, quantity_total, quantity_available FROM inventory_items ORDER BY id DESC')->fetchAll();
        respond(['ok' => true, 'items' => $items]);
    }

    if ($action === 'items' && $method === 'POST') {
        $data = requestData();
        $name = trim((string)($data['name'] ?? ''));
        $code = strtoupper(trim((string)($data['code'] ?? '')));
        $location = trim((string)($data['location'] ?? ''));
        $condition = (string)($data['condition'] ?? 'good');
        $quantity = (int)($data['quantity'] ?? 0);
        if (!$name || !$code || !$location || !in_array($condition, ['excellent', 'good', 'fair'], true) || $quantity < 1) {
            respond(['ok' => false, 'message' => 'Complete all item details with a valid quantity.'], 422);
        }
        $insert = $database->prepare('INSERT INTO inventory_items (item_name, item_code, location_name, item_condition, quantity_total, quantity_available) VALUES (?, ?, ?, ?, ?, ?)');
        $insert->execute([$name, $code, $location, $condition, $quantity, $quantity]);
        respond(['ok' => true, 'id' => (int)$database->lastInsertId()], 201);
    }

    if ($action === 'staff' && $method === 'POST') {
        $data = requestData();
        $name = trim((string)($data['name'] ?? ''));
        $employeeId = strtoupper(trim((string)($data['employeeId'] ?? '')));
        $email = trim((string)($data['email'] ?? ''));
        $password = (string)($data['password'] ?? '');
        if (!$name || !$employeeId || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 8) {
            respond(['ok' => false, 'message' => 'Enter valid staff account information.'], 422);
        }
        $insert = $database->prepare('INSERT INTO users (name, employee_id, email, password_hash, role) VALUES (?, ?, ?, ?, "staff")');
        $insert->execute([$name, $employeeId, $email, password_hash($password, PASSWORD_DEFAULT)]);
        respond(['ok' => true], 201);
    }

    respond(['ok' => false, 'message' => 'Unsupported request.'], 404);
} catch (PDOException $exception) {
    respond(['ok' => false, 'message' => 'Database connection failed.'], 500);
}