# GSO Equipment Inventory System

A lightweight equipment borrowing and inventory management application for Trimex Colleges Inc. The project uses a static HTML/CSS/JavaScript frontend and a PHP/MySQL API.

## Features

- Admin and staff authentication
- Admin creation of staff accounts
- Equipment catalog search and condition filtering
- Inventory item creation with stock and reorder information
- Staff inventory encoding and stock checking
- Equipment borrowing requests, borrowing history, notifications, purchase orders, reports, and account settings

## Requirements

- XAMPP for Windows
- Apache and MySQL running in the XAMPP Control Panel
- PHP with the PDO MySQL extension enabled

The default database connection uses MySQL at `127.0.0.1` with user `root` and an empty password. Change the connection settings in `api.php` before deploying outside a local development environment.

## Run Locally

1. Place the project in `C:\xampp\htdocs\inventoryGSO\GSOinventory`.
2. Start Apache and MySQL from the XAMPP Control Panel.
3. Open `http://localhost/inventoryGSO/GSOinventory/` in a browser.
4. On the first API request, the application creates the `gsoinventory` database, required tables, and default accounts.

Do not open `index.html` directly when using database-backed login, staff accounts, or inventory records. Those features require Apache/PHP and MySQL.

## Default Accounts

| Role | Login | Password |
| --- | --- | --- |
| Admin | `mhelpalermo90@gmail.com` | `dikoalam` |
| Staff | `maria.santos@trimex.edu.ph` or `GSO-2026-001` | `dikoalam` |

The Admin can create additional staff accounts from **Staff Accounts**. A staff user can sign in with either their email address or employee ID.

## Inventory Records

The **Browse Equipment** page lets an Admin add an item with these inventory-register fields:

- Description and item code
- Unit and storage location
- Item condition
- Beginning inventory
- Reorder level and reorder quantity
- Reorder date
- Calculated total reorder, total out, and total stock

For a newly created item, total stock is calculated as:

$$\text{Total Stock} = \text{Beginning Inventory} + \text{Reorder Quantity}$$

New inventory items are stored in MySQL and are loaded again when the catalog is refreshed. Total out begins at `0` for a new record.

## Borrowing Email Verification

Borrowers must enter an email address when submitting a borrowing request. The API creates a pending request and emails a single-use verification link that expires after 30 minutes. Opening the link verifies the request and sends a confirmation notification; verified requests remain pending for administrative approval.

Email delivery uses PHP's `mail()` function with the sender `no-reply@trimex.edu.ph`. Configure a working SMTP relay or sendmail-compatible service in XAMPP's `php.ini` before using this feature outside of development. If PHP cannot send the verification email, the request is not retained.

## Roles

**Admin** has access to all dashboard sections, including staff account creation and inventory management.

**Staff** has inventory encoding and stock-check access. The Admin account management area is hidden for staff sessions.

## API

All API responses are JSON. The API entry point is `api.php`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `api.php?action=health` | Check database availability |
| `POST` | `api.php?action=login` | Sign in with `identity` and `password` |
| `GET` | `api.php?action=items` | List saved inventory items |
| `POST` | `api.php?action=items` | Create an inventory item |
| `POST` | `api.php?action=staff` | Create a staff account |
| `POST` | `api.php?action=borrowing-request` | Create a pending borrowing request and send a verification email |
| `POST` | `api.php?action=verify-borrowing` | Verify a borrowing request token |

The login endpoint accepts an email address or employee ID in the `identity` field. Staff account creation requires a unique email, a unique employee ID, and a password of at least eight characters.

## Data Storage

| Table | Purpose |
| --- | --- |
| `users` | Admin and staff user details with password hashes |
| `inventory_items` | Item identity, location, condition, stock, reorder, and inventory values |
| `borrowing_requests` | Pending and verified borrowing requests with hashed, expiring verification tokens |

The API checks for and adds newer inventory columns when it starts, so an existing local `inventory_items` table can be updated without a manual migration.

## Project Files

| File | Purpose |
| --- | --- |
| `index.html` | Application markup and interface views |
| `styles.css` | Responsive visual styling |
| `app.js` | Client-side interactions, view routing, API requests, and catalog rendering |
| `api.php` | PHP API, database initialization, authentication, and persistence |

## Development Notes

Some dashboard interactions, such as borrowing requests, notifications, purchase orders, reports, and account settings, are currently maintained in the browser for the active session. Authentication, staff accounts, and added inventory items use the database API.

The **Reset demo credentials** button only clears browser `localStorage`; it does not remove records from the MySQL database.