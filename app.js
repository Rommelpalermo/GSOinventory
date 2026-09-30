lucide.createIcons();

const appShell = document.getElementById('appShell');
const loginScreen = document.getElementById('loginScreen');
const defaultAdminPassword = 'dikoalam';
const defaultStaffAccount = { name: 'Maria Santos', employeeId: 'GSO-2026-001', email: 'maria.santos@trimex.edu.ph', password: 'dikoalam' };
let adminPassword = localStorage.getItem('gsoAdminPassword') || 'dikoalam';
let staffAccounts = JSON.parse(localStorage.getItem('gsoStaffAccounts') || 'null') || [
  defaultStaffAccount
];
const dashboardContent = document.querySelector('.content');
const browseView = document.getElementById('browse');
const requestView = document.getElementById('request');
const purchaseOrdersView = document.getElementById('purchaseOrders');
const reportsView = document.getElementById('reports');
const staffAccountsView = document.getElementById('staffAccounts');
const notificationsView = document.getElementById('notificationsPage');
const historyView = document.getElementById('historyPage');
const settingsView = document.getElementById('settingsPage');
const borrowingsView = document.getElementById('borrowingsPage');
const sidebar = document.getElementById('sidebar');
const toast = document.getElementById('toast');
const availableCount = document.getElementById('availableCount');
const activeBorrowingCount = document.getElementById('activeBorrowingCount');
const notificationBadge = document.getElementById('notificationBadge');
const unreadText = document.getElementById('unreadText');
let unreadNotifications = 0;
let toastTimer;
const borrowingRecords = [
  { item: 'Wireless Microphone Set', icon: 'mic-vocal', status: 'pending', date: 'Requested today', dueDate: 'Pending approval' }
];

function saveStaffAccounts() {
  localStorage.setItem('gsoStaffAccounts', JSON.stringify(staffAccounts));
}

function startSession(account) {
  const isStaff = account.role === 'staff';
  document.body.classList.toggle('staff-session', isStaff);
  document.querySelector('.nav-list').hidden = isStaff;
  document.getElementById('topbarName').textContent = account.name;
  document.getElementById('profileAvatar').textContent = account.name.charAt(0).toUpperCase();
  document.querySelector('.profile small').textContent = isStaff ? 'Inventory Staff' : 'GSO Admin';
  loginScreen.hidden = true;
  appShell.hidden = false;
  if (isStaff) showStaffAccounts();
  else showDashboard();
}

document.getElementById('loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const loginForm = event.currentTarget;
  const identity = document.getElementById('loginIdentity').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;
  try {
    const response = await fetch('api.php?action=login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity, password })
    });
    const result = await response.json();
    if (response.ok && result.ok) {
      document.getElementById('loginError').hidden = true;
      loginForm.reset();
      startSession(result.user);
      return;
    }
    document.getElementById('loginError').hidden = false;
    return;
  } catch {
    // Opening index.html directly has no PHP server, so use the local demo credentials.
  }
  const isAdmin = identity === 'mhelpalermo90@gmail.com' && (password === adminPassword || password === defaultAdminPassword);
  const staff = staffAccounts.find((account) => (account.email.toLowerCase() === identity || account.employeeId.toLowerCase() === identity) && account.password === password)
    || ((identity === defaultStaffAccount.email || identity === defaultStaffAccount.employeeId.toLowerCase()) && password === defaultStaffAccount.password ? defaultStaffAccount : null);
  if (!isAdmin && !staff) {
    document.getElementById('loginError').hidden = false;
    return;
  }
  document.getElementById('loginError').hidden = true;
  loginForm.reset();
  startSession(isAdmin ? { name: 'mhel palermo', role: 'admin' } : { ...staff, role: 'staff' });
});
document.getElementById('resetCredentials').addEventListener('click', () => {
  localStorage.removeItem('gsoAdminPassword');
  localStorage.removeItem('gsoStaffAccounts');
  window.location.reload();
});

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2600);
}

async function verifyBorrowingFromEmail(token) {
  const notice = document.getElementById('verificationNotice');
  try {
    const response = await fetch('api.php?action=verify-borrowing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    const result = await response.json();
    notice.textContent = response.ok && result.ok
      ? `${result.request.item} has been verified and is pending approval.`
      : (result.message || 'Unable to verify this borrowing request.');
  } catch {
    notice.textContent = 'Unable to verify this borrowing request. Please try again.';
  }
  notice.hidden = false;
  window.history.replaceState({}, document.title, window.location.pathname);
}

const verificationToken = new URLSearchParams(window.location.search).get('verify');
if (verificationToken) verifyBorrowingFromEmail(verificationToken);

function showDashboard(scrollToBorrowings = false) {
  dashboardContent.hidden = false;
  browseView.hidden = true;
  requestView.hidden = true;
  purchaseOrdersView.hidden = true;
  reportsView.hidden = true;
  staffAccountsView.hidden = true;
  notificationsView.hidden = true;
  historyView.hidden = true;
  settingsView.hidden = true;
  borrowingsView.hidden = true;
  if (scrollToBorrowings) document.getElementById('borrowings').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showBrowse() {
  dashboardContent.hidden = true;
  browseView.hidden = false;
  requestView.hidden = true;
  purchaseOrdersView.hidden = true;
  reportsView.hidden = true;
  staffAccountsView.hidden = true;
  notificationsView.hidden = true;
  historyView.hidden = true;
  settingsView.hidden = true;
  borrowingsView.hidden = true;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showRequest() {
  dashboardContent.hidden = true;
  browseView.hidden = true;
  requestView.hidden = false;
  purchaseOrdersView.hidden = true;
  reportsView.hidden = true;
  staffAccountsView.hidden = true;
  notificationsView.hidden = true;
  historyView.hidden = true;
  settingsView.hidden = true;
  borrowingsView.hidden = true;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showPurchaseOrders() {
  dashboardContent.hidden = true;
  browseView.hidden = true;
  requestView.hidden = true;
  purchaseOrdersView.hidden = false;
  reportsView.hidden = true;
  staffAccountsView.hidden = true;
  notificationsView.hidden = true;
  historyView.hidden = true;
  settingsView.hidden = true;
  borrowingsView.hidden = true;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function formatReportCount(count) {
  return `${count} record${count === 1 ? '' : 's'}`;
}

function renderReports() {
  const purchaseRows = [...document.querySelectorAll('#purchaseOrderRows tr')];
  const pendingBorrowings = borrowingRecords.filter((record) => record.status === 'pending');
  const totalOrderValue = purchaseRows.reduce((total, row) => total + Number(row.cells[4].textContent.replace(/[^\d.]/g, '')), 0);
  document.getElementById('reportBorrowingTotal').textContent = borrowingRecords.length;
  document.getElementById('reportPendingBorrowings').textContent = pendingBorrowings.length;
  document.getElementById('reportPurchaseOrderTotal').textContent = purchaseRows.length;
  document.getElementById('reportOrderValue').textContent = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(totalOrderValue);
  document.getElementById('reportBorrowingCaption').textContent = formatReportCount(borrowingRecords.length);
  document.getElementById('reportPurchaseCaption').textContent = formatReportCount(purchaseRows.length);
  document.getElementById('reportBorrowingRows').innerHTML = borrowingRecords.map((record) => `<tr><td>${record.item}</td><td>${record.date}</td><td><span class="report-status ${record.status}">${record.status}</span></td></tr>`).join('');
  document.getElementById('reportPurchaseRows').innerHTML = purchaseRows.map((row) => `<tr><td>${row.cells[0].textContent}</td><td>${row.cells[2].textContent}</td><td>${row.cells[4].textContent}</td><td>${row.cells[5].textContent}</td></tr>`).join('');
}

function showReports() {
  dashboardContent.hidden = true;
  browseView.hidden = true;
  requestView.hidden = true;
  purchaseOrdersView.hidden = true;
  reportsView.hidden = false;
  staffAccountsView.hidden = true;
  notificationsView.hidden = true;
  historyView.hidden = true;
  settingsView.hidden = true;
  borrowingsView.hidden = true;
  renderReports();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderStaffStock() {
  const query = document.getElementById('staffStockSearch').value.toLowerCase();
  const stockList = document.getElementById('staffStockList');
  const stockItems = [...document.querySelectorAll('.equipment-card')].filter((card) => `${card.dataset.name} ${card.dataset.code}`.toLowerCase().includes(query));
  stockList.innerHTML = stockItems.length ? stockItems.map((card) => `<article class="staff-stock-item"><span><i data-lucide="package"></i></span><div><strong>${card.querySelector('.equipment-title h3').textContent}</strong><small>${card.dataset.code} · ${card.querySelector('.location').childNodes[2].textContent.trim()}</small></div><b>${card.querySelector('.stock').textContent}</b></article>`).join('') : '<p class="empty-stock">No stock items match your search.</p>';
  lucide.createIcons({ nodes: [stockList] });
}

function showStaffAccounts() {
  dashboardContent.hidden = true;
  browseView.hidden = true;
  requestView.hidden = true;
  purchaseOrdersView.hidden = true;
  reportsView.hidden = true;
  staffAccountsView.hidden = false;
  notificationsView.hidden = true;
  historyView.hidden = true;
  settingsView.hidden = true;
  borrowingsView.hidden = true;
  renderStaffStock();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showNotifications() {
  dashboardContent.hidden = true;
  browseView.hidden = true;
  requestView.hidden = true;
  purchaseOrdersView.hidden = true;
  reportsView.hidden = true;
  staffAccountsView.hidden = true;
  notificationsView.hidden = false;
  historyView.hidden = true;
  settingsView.hidden = true;
  borrowingsView.hidden = true;
  unreadNotifications = 0;
  notificationBadge.hidden = true;
  document.querySelector('.notification-dot').hidden = true;
  unreadText.textContent = '0 unread notifications';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showHistory() {
  dashboardContent.hidden = true;
  browseView.hidden = true;
  requestView.hidden = true;
  purchaseOrdersView.hidden = true;
  reportsView.hidden = true;
  staffAccountsView.hidden = true;
  notificationsView.hidden = true;
  historyView.hidden = false;
  settingsView.hidden = true;
  borrowingsView.hidden = true;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showSettings() {
  dashboardContent.hidden = true;
  browseView.hidden = true;
  requestView.hidden = true;
  purchaseOrdersView.hidden = true;
  reportsView.hidden = true;
  staffAccountsView.hidden = true;
  notificationsView.hidden = true;
  historyView.hidden = true;
  settingsView.hidden = false;
  borrowingsView.hidden = true;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showBorrowings() {
  dashboardContent.hidden = true;
  browseView.hidden = true;
  requestView.hidden = true;
  purchaseOrdersView.hidden = true;
  reportsView.hidden = true;
  staffAccountsView.hidden = true;
  notificationsView.hidden = true;
  historyView.hidden = true;
  settingsView.hidden = true;
  borrowingsView.hidden = false;
  renderBorrowings(document.querySelector('.borrowing-tab.active').dataset.status);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function addNotification(item) {
  const emptyState = document.querySelector('.empty-notifications');
  if (emptyState) emptyState.remove();
  const notification = document.createElement('article');
  notification.className = 'full-notification';
  notification.innerHTML = `<span class="notification-bullet"></span><div><h3>Borrowing request submitted</h3><p>Your borrowing request for ${item} has been submitted and is pending approval. - GSO Equipment System</p><time>Just now</time></div>`;
  document.getElementById('notificationsList').prepend(notification);
  unreadNotifications += 1;
  notificationBadge.hidden = false;
  notificationBadge.textContent = unreadNotifications;
  document.querySelector('.notification-dot').hidden = false;
  unreadText.textContent = `${unreadNotifications} unread notification${unreadNotifications === 1 ? '' : 's'}`;
}

function addBorrowing(item, icon, dueDate, status = 'active') {
  borrowingRecords.unshift({ item, icon, status, date: status === 'pending' ? 'Requested today' : 'Borrowed today', dueDate: status === 'pending' ? 'Pending approval' : `Due ${dueDate}` });
  const row = document.createElement('div');
  row.className = 'borrowing-item';
  row.innerHTML = `<span class="item-icon"><i data-lucide="${icon}"></i></span><div class="item-details"><strong>${item}</strong><span>Borrowed today</span></div><span class="status">Due ${dueDate}</span>`;
  document.getElementById('borrowingList').prepend(row);
  lucide.createIcons({ nodes: [row] });
}

function renderBorrowings(status) {
  const visibleRecords = borrowingRecords.filter((record) => record.status === status);
  document.querySelectorAll('.borrowing-tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.status === status));
  ['active', 'pending', 'overdue', 'completed'].forEach((currentStatus) => {
    document.getElementById(`${currentStatus}TabCount`).textContent = borrowingRecords.filter((record) => record.status === currentStatus).length;
  });
  const results = document.getElementById('borrowingsResults');
  if (!visibleRecords.length) {
    results.innerHTML = `<div class="borrowings-empty"><i data-lucide="clipboard-list"></i><p>No ${status} borrowings</p></div>`;
  } else {
    results.innerHTML = visibleRecords.map((record) => `<article class="borrowing-record"><span class="record-icon"><i data-lucide="${record.icon}"></i></span><div><h3>${record.item}</h3><p>${record.date}</p></div><span class="record-status ${record.status}">${record.dueDate}</span></article>`).join('');
  }
  lucide.createIcons({ nodes: [results] });
}

function addHistoryEntry(item, code, borrowDate, dueDate) {
  const row = document.createElement('tr');
  row.dataset.search = `${item} ${code}`.toLowerCase();
  row.innerHTML = `<td>${item}</td><td>${code}</td><td>${borrowDate}</td><td>${dueDate}</td><td>&mdash;</td><td><span class="history-status pending">Pending</span></td>`;
  document.getElementById('historyRows').prepend(row);
}

function activateNav(item) {
  document.querySelectorAll('.nav-item').forEach((navItem) => navItem.classList.remove('active'));
  item.classList.add('active');
  sidebar.classList.remove('open');
}

document.getElementById('menuToggle').addEventListener('click', () => sidebar.classList.toggle('open'));

document.querySelectorAll('.nav-item').forEach((item) => {
  item.addEventListener('click', (event) => {
    event.preventDefault();
    activateNav(item);
    if (item.getAttribute('href') === '#browse') showBrowse();
    else if (item.getAttribute('href') === '#request') showRequest();
    else if (item.getAttribute('href') === '#purchaseOrders') showPurchaseOrders();
    else if (item.getAttribute('href') === '#reports') showReports();
    else if (item.getAttribute('href') === '#staffAccounts') showStaffAccounts();
    else if (item.getAttribute('href') === '#notifications') showNotifications();
    else if (item.getAttribute('href') === '#history') showHistory();
    else if (item.getAttribute('href') === '#settings') showSettings();
    else if (item.getAttribute('href') === '#borrowings') showBorrowings();
    else {
      showDashboard();
      if (item.getAttribute('href') !== '#dashboard') showToast(`${item.textContent.trim()} selected`);
    }
  });
});

document.querySelectorAll('.shortcut').forEach((shortcut) => {
  shortcut.addEventListener('click', () => {
    const view = shortcut.dataset.view;
    if (view === 'Browse Equipment') showBrowse();
    else if (view === 'My Borrowings') showBorrowings();
    else if (view === 'Request Equipment') showRequest();
    else if (view === 'Purchase Orders') showPurchaseOrders();
    else if (view === 'Reports') showReports();
    else if (view === 'Staff Accounts') showStaffAccounts();
    else if (view === 'Notifications') showNotifications();
    else if (view === 'Borrowing History') showHistory();
    else if (view === 'Account Settings') showSettings();
    else showToast(`${view} selected`);
  });
});

function attachBorrowHandler(button) {
  button.addEventListener('click', () => {
    const stock = button.closest('.equipment-card').querySelector('.stock');
    const [available, total] = stock.textContent.match(/\d+/g).map(Number);
    if (!available) return;

    stock.textContent = `${available - 1}/${total} available`;
    availableCount.textContent = Number(availableCount.textContent) - 1;
    activeBorrowingCount.textContent = Number(activeBorrowingCount.textContent) + 1;
    button.disabled = true;
    button.textContent = 'Borrowed';

    addBorrowing(button.dataset.item, button.dataset.icon, 'Oct 01');
    showToast(`${button.dataset.item} added to your borrowings`);
  });
}

document.querySelectorAll('.borrow-button').forEach(attachBorrowHandler);

const addItemForm = document.getElementById('addItemForm');
const beginningInventoryInput = document.getElementById('newItemBeginningInventory');
const reorderQuantityInput = document.getElementById('newItemReorderQuantity');

function updateInventoryTotals() {
  const beginningInventory = Number(beginningInventoryInput.value) || 0;
  const reorderQuantity = Number(reorderQuantityInput.value) || 0;
  document.getElementById('newItemTotalReorder').value = reorderQuantity;
  document.getElementById('newItemTotalOut').value = 0;
  document.getElementById('newItemTotalStock').value = beginningInventory + reorderQuantity;
}

beginningInventoryInput.addEventListener('input', updateInventoryTotals);
reorderQuantityInput.addEventListener('input', updateInventoryTotals);

function createInventoryCard({ name, code, unit, location, condition, beginningInventory, reorderQuantity, totalStock }) {
  const conditionLabel = condition.charAt(0).toUpperCase() + condition.slice(1);
  const card = document.createElement('article');
  card.className = 'equipment-card';
  card.dataset.name = name;
  card.dataset.code = code;
  card.dataset.condition = condition;
  card.innerHTML = `<div class="equipment-visual"><i data-lucide="package"></i></div><div class="equipment-info"><div class="equipment-title"><div><h3>${name}</h3><p>${code}</p></div><span>Available</span></div><p class="location"><i data-lucide="map-pin"></i> ${location}<b>${conditionLabel}</b></p><p class="inventory-details">Unit: ${unit} | Beginning: ${beginningInventory} | Reorder: ${reorderQuantity} | Out: 0</p><div class="equipment-footer"><span class="stock">${totalStock}/${totalStock} available</span><button class="borrow-button" data-item="${name}" data-icon="package">Borrow</button></div></div>`;
  attachBorrowHandler(card.querySelector('.borrow-button'));
  lucide.createIcons({ nodes: [card] });
  return card;
}

async function loadInventoryItems() {
  try {
    const response = await fetch('api.php?action=items');
    const result = await response.json();
    if (!response.ok || !result.ok) return;
    [...result.items].reverse().forEach((item) => {
      const card = createInventoryCard({
        name: item.item_name,
        code: item.item_code,
        unit: item.unit_name,
        location: item.location_name,
        condition: item.item_condition,
        beginningInventory: item.beginning_inventory,
        reorderQuantity: item.reorder_quantity,
        totalStock: item.quantity_available
      });
      document.getElementById('equipmentGrid').prepend(card);
      availableCount.textContent = Number(availableCount.textContent) + item.quantity_available;
    });
    filterEquipment();
  } catch {
    // The static catalog remains available if the local PHP server is offline.
  }
}

loadInventoryItems();
document.getElementById('showAddItemForm').addEventListener('click', () => {
  addItemForm.hidden = false;
  document.getElementById('newItemName').focus();
});
document.getElementById('closeAddItemForm').addEventListener('click', () => {
  addItemForm.hidden = true;
});
addItemForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = document.getElementById('newItemName').value.trim();
  const code = document.getElementById('newItemCode').value.trim().toUpperCase();
  const unit = document.getElementById('newItemUnit').value.trim();
  const location = document.getElementById('newItemLocation').value.trim();
  const condition = document.getElementById('newItemCondition').value;
  const beginningInventory = Number(beginningInventoryInput.value);
  const reorderLevel = Number(document.getElementById('newItemReorderLevel').value);
  const reorderQuantity = Number(reorderQuantityInput.value);
  const reorderDate = document.getElementById('newItemReorderDate').value;
  const totalStock = Number(document.getElementById('newItemTotalStock').value);
  try {
    const response = await fetch('api.php?action=items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, code, unit, location, condition, beginningInventory, reorderLevel, reorderQuantity, reorderDate, quantity: totalStock })
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      showToast(result.message || 'Unable to add the inventory item');
      return;
    }
  } catch {
    showToast('Unable to connect to the server. Please try again.');
    return;
  }
  const card = createInventoryCard({ name, code, unit, location, condition, beginningInventory, reorderQuantity, totalStock });
  document.getElementById('equipmentGrid').prepend(card);
  availableCount.textContent = Number(availableCount.textContent) + totalStock;
  event.currentTarget.reset();
  document.getElementById('newItemUnit').value = 'piece';
  beginningInventoryInput.value = 0;
  document.getElementById('newItemReorderLevel').value = 0;
  reorderQuantityInput.value = 0;
  updateInventoryTotals();
  addItemForm.hidden = true;
  filterEquipment();
  renderStaffStock();
  showToast(`${name} added to the catalog`);
});

document.getElementById('staffAccountForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = document.getElementById('staffName').value.trim();
  const employeeId = document.getElementById('staffEmployeeId').value.trim().toUpperCase();
  const email = document.getElementById('staffEmail').value.trim();
  const password = document.getElementById('staffPassword').value;
  const accountExists = staffAccounts.some((account) => account.email.toLowerCase() === email.toLowerCase() || account.employeeId === employeeId);
  if (accountExists) {
    showToast('A staff account already uses that email or employee ID');
    return;
  }
  try {
    const response = await fetch('api.php?action=staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, employeeId, email, password })
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      showToast(result.message || 'Unable to create the staff account');
      return;
    }
  } catch {
    showToast('Unable to connect to the server. Please try again.');
    return;
  }
  staffAccounts.unshift({ name, employeeId, email, password });
  saveStaffAccounts();
  const row = document.createElement('tr');
  row.innerHTML = `<td>${name}</td><td>${employeeId}</td><td>${email}</td><td><span class="staff-role">Inventory Staff</span></td>`;
  document.getElementById('staffAccountRows').prepend(row);
  event.currentTarget.reset();
  showToast(`${name}'s staff account was created`);
});

document.getElementById('staffEncodeForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const name = document.getElementById('staffItemName').value.trim();
  const code = document.getElementById('staffItemCode').value.trim().toUpperCase();
  const location = document.getElementById('staffItemLocation').value.trim();
  const condition = document.getElementById('staffItemCondition').value;
  const quantity = Number(document.getElementById('staffItemQuantity').value);
  const conditionLabel = condition.charAt(0).toUpperCase() + condition.slice(1);
  const card = document.createElement('article');
  card.className = 'equipment-card';
  card.dataset.name = name;
  card.dataset.code = code;
  card.dataset.condition = condition;
  card.innerHTML = `<div class="equipment-visual"><i data-lucide="package"></i></div><div class="equipment-info"><div class="equipment-title"><div><h3>${name}</h3><p>${code}</p></div><span>Available</span></div><p class="location"><i data-lucide="map-pin"></i> ${location}<b>${conditionLabel}</b></p><div class="equipment-footer"><span class="stock">${quantity}/${quantity} available</span><button class="borrow-button" data-item="${name}" data-icon="package">Borrow</button></div></div>`;
  document.getElementById('equipmentGrid').prepend(card);
  attachBorrowHandler(card.querySelector('.borrow-button'));
  lucide.createIcons({ nodes: [card] });
  availableCount.textContent = Number(availableCount.textContent) + quantity;
  event.currentTarget.reset();
  document.getElementById('staffItemQuantity').value = 1;
  filterEquipment();
  renderStaffStock();
  showToast(`${name} saved to the inventory catalog`);
});
document.getElementById('staffStockSearch').addEventListener('input', renderStaffStock);

function filterEquipment() {
  const query = document.getElementById('equipmentSearch').value.toLowerCase();
  const condition = document.getElementById('equipmentFilter').value;
  let visibleCount = 0;
  document.querySelectorAll('.equipment-card').forEach((card) => {
    const matchesQuery = `${card.dataset.name} ${card.dataset.code}`.toLowerCase().includes(query);
    const matchesCondition = condition === 'all' || card.dataset.condition === condition;
    card.hidden = !matchesQuery || !matchesCondition;
    if (!card.hidden) visibleCount += 1;
  });
  document.getElementById('emptyCatalog').hidden = visibleCount !== 0;
}

document.getElementById('equipmentSearch').addEventListener('input', filterEquipment);
document.getElementById('equipmentFilter').addEventListener('change', filterEquipment);
const requestEquipment = document.getElementById('requestEquipment');
const requestItems = {
  projector: { item: 'Projector (Epson)', code: 'PRJ-00045', icon: 'projector', category: 'Projector', condition: 'Excellent', location: 'GSO Room 102', available: 3 },
  microphone: { item: 'Wireless Microphone Set', code: 'AUD-0012', icon: 'mic-vocal', category: 'Audio', condition: 'Good', location: 'GSO Room 201', available: 4 },
  tripod: { item: 'Tripod Stand', code: 'TLS-00034', icon: 'axis-3d', category: 'Tools', condition: 'Good', location: 'GSO Room 102', available: 6 },
  extension: { item: 'Extension Cord (20m)', code: 'TLS-0056', icon: 'cable', category: 'Electrical', condition: 'Fair', location: 'GSO Storage', available: 7 }
};

function updateRequestEquipment() {
  const selected = requestItems[requestEquipment.value];
  document.getElementById('equipmentSummary').innerHTML = `<span>Category: <b>${selected.category}</b></span><span>Condition: <b>${selected.condition}</b></span><span>Location: <b>${selected.location}</b></span><span>Available: <b>${selected.available}</b></span>`;
  document.getElementById('requestQuantity').max = selected.available;
}

requestEquipment.addEventListener('change', updateRequestEquipment);
document.getElementById('borrowingRequestForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const selected = requestItems[requestEquipment.value];
  const quantity = Number(document.getElementById('requestQuantity').value);
  try {
    const response = await fetch('api.php?action=borrowing-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.getElementById('borrowerEmail').value.trim(),
        item: selected.item,
        code: selected.code,
        quantity,
        purpose: document.getElementById('requestPurpose').value.trim(),
        borrowAt: document.getElementById('borrowDate').value,
        returnAt: document.getElementById('returnDate').value
      })
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      showToast(result.message || 'Unable to send the verification email');
      return;
    }
    event.currentTarget.reset();
    updateRequestEquipment();
    showToast('Verification link sent. Confirm it from your email to continue.');
  } catch {
    showToast('Unable to connect to the server. Please try again.');
  }
});
document.getElementById('purchaseOrderForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const supplier = document.getElementById('purchaseSupplier').value.trim();
  const item = document.getElementById('purchaseItem').value.trim();
  const quantity = Number(document.getElementById('purchaseQuantity').value);
  const unitPrice = Number(document.getElementById('purchasePrice').value);
  const rows = document.getElementById('purchaseOrderRows');
  const orderNumber = `PO-2026-${String(rows.rows.length + 1).padStart(3, '0')}`;
  const total = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(quantity * unitPrice);
  const row = document.createElement('tr');
  row.innerHTML = `<td>${orderNumber}</td><td>${supplier}</td><td>${item}</td><td>${quantity}</td><td>${total}</td><td><span class="purchase-status draft">Draft</span></td>`;
  rows.prepend(row);
  const orderCount = rows.rows.length;
  document.getElementById('purchaseOrderCount').textContent = `${orderCount} order${orderCount === 1 ? '' : 's'}`;
  event.currentTarget.reset();
  document.getElementById('purchaseQuantity').value = 1;
  showToast(`${orderNumber} created as a draft`);
});
document.getElementById('printReport').addEventListener('click', () => window.print());
document.getElementById('notificationButton').addEventListener('click', () => {
  showNotifications();
});
document.getElementById('historySearch').addEventListener('input', (event) => {
  const query = event.target.value.toLowerCase();
  let visibleRows = 0;
  document.querySelectorAll('#historyRows tr').forEach((row) => {
    row.hidden = !row.dataset.search.includes(query);
    if (!row.hidden) visibleRows += 1;
  });
  document.getElementById('emptyHistory').hidden = visibleRows !== 0;
});
document.getElementById('profileForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const currentPassword = document.getElementById('currentAdminPassword').value;
  const newPassword = document.getElementById('newAdminPassword').value;
  const confirmedPassword = document.getElementById('confirmAdminPassword').value;
  if (currentPassword || newPassword || confirmedPassword) {
    if (currentPassword !== adminPassword || newPassword.length < 8 || newPassword !== confirmedPassword) {
      showToast('Enter the correct current password and matching new password');
      return;
    }
    adminPassword = newPassword;
    localStorage.setItem('gsoAdminPassword', adminPassword);
    document.getElementById('currentAdminPassword').value = '';
    document.getElementById('newAdminPassword').value = '';
    document.getElementById('confirmAdminPassword').value = '';
  }
  const name = document.getElementById('settingsName').textContent;
  const initial = name.trim().charAt(0).toUpperCase();
  document.getElementById('topbarName').textContent = name;
  document.getElementById('profileAvatar').textContent = initial;
  document.getElementById('settingsInitial').textContent = initial;
  showToast('Profile changes saved');
});
document.querySelectorAll('.borrowing-tab').forEach((tab) => {
  tab.addEventListener('click', () => renderBorrowings(tab.dataset.status));
});
document.querySelector('.sign-out').addEventListener('click', () => {
  appShell.hidden = true;
  loginScreen.hidden = false;
  document.body.classList.remove('staff-session');
  document.querySelector('.nav-list').hidden = false;
  document.getElementById('loginIdentity').focus();
});