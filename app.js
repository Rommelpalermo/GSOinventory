lucide.createIcons();

const dashboardContent = document.querySelector('.content');
const browseView = document.getElementById('browse');
const requestView = document.getElementById('request');
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

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2600);
}

function showDashboard(scrollToBorrowings = false) {
  dashboardContent.hidden = false;
  browseView.hidden = true;
  requestView.hidden = true;
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
  notificationsView.hidden = true;
  historyView.hidden = true;
  settingsView.hidden = true;
  borrowingsView.hidden = true;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showNotifications() {
  dashboardContent.hidden = true;
  browseView.hidden = true;
  requestView.hidden = true;
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
    else if (view === 'Notifications') showNotifications();
    else if (view === 'Borrowing History') showHistory();
    else if (view === 'Account Settings') showSettings();
    else showToast(`${view} selected`);
  });
});

document.querySelectorAll('.borrow-button').forEach((button) => {
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
});

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
document.getElementById('borrowingRequestForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const selected = requestItems[requestEquipment.value];
  const returnDate = new Date(document.getElementById('returnDate').value);
  const borrowDate = new Date(document.getElementById('borrowDate').value);
  const dueDate = returnDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
  const historyBorrowDate = borrowDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  const historyDueDate = returnDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  const quantity = Number(document.getElementById('requestQuantity').value);
  addBorrowing(quantity > 1 ? `${selected.item} (${quantity} units)` : selected.item, selected.icon, dueDate, 'pending');
  availableCount.textContent = Number(availableCount.textContent) - quantity;
  activeBorrowingCount.textContent = Number(activeBorrowingCount.textContent) + 1;
  addHistoryEntry(quantity > 1 ? `${selected.item} (${quantity} units)` : selected.item, selected.code, historyBorrowDate, historyDueDate);
  addNotification(selected.item);
  event.currentTarget.reset();
  updateRequestEquipment();
  showDashboard(true);
  showToast(`${selected.item} request submitted and added to your borrowings`);
});
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
document.querySelector('.sign-out').addEventListener('click', () => showToast('Signed out successfully'));