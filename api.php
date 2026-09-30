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

function sendEmail(string $recipient, string $subject, string $message): bool
{
    $headers = [
        'MIME-Version: 1.0',
        'Content-type: text/html; charset=UTF-8',
        'From: GSO Equipment <no-reply@trimex.edu.ph>',
    ];
    return mail($recipient, $subject, $message, implode("\r\n", $headers));
}

try {
    $server = new PDO(
        'mysql:host=127.0.0.1;charset=utf8mb4',
        'root',
        '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
    $server->exec('CREATE DATABASE IF NOT EXISTS gsoinventory CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
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
    $database->exec(
        'CREATE TABLE IF NOT EXISTS borrowing_requests (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            borrower_email VARCHAR(150) NOT NULL,
            item_name VARCHAR(150) NOT NULL,
            item_code VARCHAR(50) NOT NULL,
            quantity INT UNSIGNED NOT NULL,
            purpose TEXT NOT NULL,
            borrow_at DATETIME NOT NULL,
            return_at DATETIME NOT NULL,
            verification_hash CHAR(64) NOT NULL UNIQUE,
            verification_expires_at DATETIME NOT NULL,
            verified_at DATETIME NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );
    $ensureInventoryColumn = static function (string $column, string $definition) use ($database): void {
        $exists = $database->prepare('SHOW COLUMNS FROM inventory_items LIKE ?');
        $exists->execute([$column]);
        if (!$exists->fetch()) {
            $database->exec("ALTER TABLE inventory_items ADD COLUMN `$column` $definition");
        }
    };
    $ensureInventoryColumn('unit_name', "VARCHAR(50) NOT NULL DEFAULT 'piece'");
    $ensureInventoryColumn('beginning_inventory', 'INT UNSIGNED NOT NULL DEFAULT 0');
    $ensureInventoryColumn('reorder_level', 'INT UNSIGNED NOT NULL DEFAULT 0');
    $ensureInventoryColumn('reorder_quantity', 'INT UNSIGNED NOT NULL DEFAULT 0');
    $ensureInventoryColumn('quantity_out', 'INT UNSIGNED NOT NULL DEFAULT 0');
    $ensureInventoryColumn('reorder_date', 'DATE NULL');

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
        $items = $database->query('SELECT id, item_name, item_code, unit_name, location_name, item_condition, beginning_inventory, reorder_level, reorder_quantity, quantity_out, reorder_date, quantity_total, quantity_available FROM inventory_items ORDER BY id DESC')->fetchAll();
        respond(['ok' => true, 'items' => $items]);
    }

    if ($action === 'items' && $method === 'POST') {
        $data = requestData();
        $name = trim((string)($data['name'] ?? ''));
        $code = strtoupper(trim((string)($data['code'] ?? '')));
        $unit = trim((string)($data['unit'] ?? ''));
        $location = trim((string)($data['location'] ?? ''));
        $condition = (string)($data['condition'] ?? 'good');
        $beginningInventory = (int)($data['beginningInventory'] ?? 0);
        $reorderLevel = (int)($data['reorderLevel'] ?? 0);
        $reorderQuantity = (int)($data['reorderQuantity'] ?? 0);
        $reorderDate = trim((string)($data['reorderDate'] ?? ''));
        if (!$name || !$code || !$unit || !$location || !in_array($condition, ['excellent', 'good', 'fair'], true) || $beginningInventory < 0 || $reorderLevel < 0 || $reorderQuantity < 0 || ($reorderDate && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $reorderDate))) {
            respond(['ok' => false, 'message' => 'Complete all item details with a valid quantity.'], 422);
        }
        $totalStock = $beginningInventory + $reorderQuantity;
        $insert = $database->prepare('INSERT INTO inventory_items (item_name, item_code, unit_name, location_name, item_condition, beginning_inventory, reorder_level, reorder_quantity, quantity_out, reorder_date, quantity_total, quantity_available) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)');
        $insert->execute([$name, $code, $unit, $location, $condition, $beginningInventory, $reorderLevel, $reorderQuantity, $reorderDate ?: null, $totalStock, $totalStock]);
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
        try {
            $insert = $database->prepare('INSERT INTO users (name, employee_id, email, password_hash, role) VALUES (?, ?, ?, ?, "staff")');
            $insert->execute([$name, $employeeId, $email, password_hash($password, PASSWORD_DEFAULT)]);
        } catch (PDOException $exception) {
            if ($exception->getCode() === '23000') {
                respond(['ok' => false, 'message' => 'A staff account already uses that email or employee ID.'], 409);
            }
            throw $exception;
        }
        respond(['ok' => true], 201);
    }

    if ($action === 'borrowing-request' && $method === 'POST') {
        $data = requestData();
        $email = trim((string)($data['email'] ?? ''));
        $item = trim((string)($data['item'] ?? ''));
        $code = strtoupper(trim((string)($data['code'] ?? '')));
        $quantity = (int)($data['quantity'] ?? 0);
        $purpose = trim((string)($data['purpose'] ?? ''));
        $borrowAt = trim((string)($data['borrowAt'] ?? ''));
        $returnAt = trim((string)($data['returnAt'] ?? ''));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !$item || !$code || $quantity < 1 || !$purpose || !$borrowAt || !$returnAt) {
            respond(['ok' => false, 'message' => 'Complete the borrowing request with valid details.'], 422);
        }
        $token = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $token);
        $expiresAt = (new DateTimeImmutable('+30 minutes'))->format('Y-m-d H:i:s');
        $insert = $database->prepare('INSERT INTO borrowing_requests (borrower_email, item_name, item_code, quantity, purpose, borrow_at, return_at, verification_hash, verification_expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $insert->execute([$email, $item, $code, $quantity, $purpose, $borrowAt, $returnAt, $tokenHash, $expiresAt]);

        $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        $basePath = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/')), '/');
        $verificationUrl = "{$scheme}://{$host}{$basePath}/?verify=" . urlencode($token);
        $message = '<p>Please verify your borrowing request for <strong>' . htmlspecialchars($item, ENT_QUOTES, 'UTF-8') . '</strong>.</p><p><a href="' . htmlspecialchars($verificationUrl, ENT_QUOTES, 'UTF-8') . '">Verify borrowing request</a></p><p>This link expires in 30 minutes.</p>';
        if (!sendEmail($email, 'Verify your GSO borrowing request', $message)) {
            $database->prepare('DELETE FROM borrowing_requests WHERE verification_hash = ?')->execute([$tokenHash]);
            respond(['ok' => false, 'message' => 'Verification email could not be sent. Check the PHP mail configuration.'], 503);
        }
        respond(['ok' => true, 'message' => 'A verification link was sent to your email address.'], 201);
    }

    if ($action === 'verify-borrowing' && $method === 'POST') {
        $data = requestData();
        $token = trim((string)($data['token'] ?? ''));
        if (!preg_match('/^[a-f0-9]{64}$/', $token)) {
            respond(['ok' => false, 'message' => 'Invalid verification link.'], 422);
        }
        $tokenHash = hash('sha256', $token);
        $findRequest = $database->prepare('SELECT id, borrower_email, item_name, item_code, quantity, return_at, verified_at FROM borrowing_requests WHERE verification_hash = ? AND verification_expires_at >= NOW() LIMIT 1');
        $findRequest->execute([$tokenHash]);
        $request = $findRequest->fetch();
        if (!$request) {
            respond(['ok' => false, 'message' => 'This verification link is invalid or has expired.'], 404);
        }
        if (!$request['verified_at']) {
            $database->prepare('UPDATE borrowing_requests SET verified_at = NOW() WHERE id = ?')->execute([$request['id']]);
            $confirmation = '<p>Your borrowing request for <strong>' . htmlspecialchars($request['item_name'], ENT_QUOTES, 'UTF-8') . '</strong> has been verified and is pending approval.</p>';
            sendEmail($request['borrower_email'], 'GSO borrowing request verified', $confirmation);
        }
        respond(['ok' => true, 'request' => ['item' => $request['item_name'], 'code' => $request['item_code'], 'quantity' => (int)$request['quantity'], 'returnAt' => $request['return_at']]]);
    }

    respond(['ok' => false, 'message' => 'Unsupported request.'], 404);
} catch (PDOException $exception) {
    respond(['ok' => false, 'message' => 'Database connection failed.'], 500);
}