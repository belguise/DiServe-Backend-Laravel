const token = localStorage.getItem("auth_token");
const user = JSON.parse(localStorage.getItem("user") || "null");
const API_BASE = (window.location.protocol === "file:" || (window.location.port && window.location.port !== "8000")) ? "http://127.0.0.1:8000" : "";

if (!token || !user || user.role !== "admin") {
    window.location.href = "login.html";
}

// User Profile in Sidebar
const adminName = document.querySelector(".sidebar-footer .user-info p");
const adminAvatar = document.querySelector(".sidebar-footer .user-avatar");
if (user && user.name) {
    if (adminName) adminName.textContent = user.name;
    if (adminAvatar) {
        const initials = user.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
        adminAvatar.textContent = initials;
    }
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });

    const targetTab = document.getElementById(tabId);
    if (targetTab) {
        targetTab.classList.remove('hidden');
    }

    document.querySelectorAll('.navigation-item').forEach(nav => {
        nav.classList.remove('active');
    });
    
    const navId = tabId.replace('tab-', 'nav-btn-');
    const activeNav = document.getElementById(navId);

    if (activeNav) {
        activeNav.classList.add('active');
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
}

function toggleDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (dropdown) {
        dropdown.classList.toggle('hidden');
    }
}

window.addEventListener('click', function(event) {
    if (!event.target.closest('.dropdown-wrapper')) {
        const dropdowns = document.querySelectorAll('.dropdown-menu');
        dropdowns.forEach(menu => {
            if (!menu.classList.contains('hidden')) {
                menu.classList.add('hidden');
            }
        });
    }
});

// Facility Management (US 16)
let currentEditingRowId = '';
let currentEditingFacilityId = null;
let currentEditingImage = '';

function openEditModal(rowId, name, category, location, capacity, address = '', imageFile = '', facilityId = null) {
    currentEditingRowId = rowId;
    currentEditingFacilityId = facilityId;
    currentEditingImage = imageFile;
    
    document.getElementById('edit-facility-name').value = name;
    document.getElementById('edit-facility-category').value = category;
    document.getElementById('edit-facility-location').value = location;
    document.getElementById('edit-facility-capacity').value = capacity;
    document.getElementById('edit-facility-address').value = address;
    
    const imgPreview = document.getElementById('edit-facility-image-preview');
    const noImgText = document.getElementById('edit-facility-no-image');

    if (imageFile && imageFile.trim() !== '') {
        imgPreview.src = 'assets/images/' + imageFile;
        imgPreview.classList.remove('hidden');
        noImgText.classList.add('hidden');
    } else {
        imgPreview.src = '';
        imgPreview.classList.add('hidden');
        noImgText.classList.remove('hidden');
    }
    
    openModal('modal-edit-facility');
}

async function submitAddFacility() {
    const nameInput = document.getElementById('add-facility-name');
    const categoryInput = document.getElementById('add-facility-category');
    const locationInput = document.getElementById('add-facility-location');
    const capacityInput = document.getElementById('add-facility-capacity');
    const addressInput = document.getElementById('add-facility-address');
    const fileInput = document.querySelector('#modal-add-facility input[type="file"]');

    if (!nameInput || !categoryInput || !locationInput || !capacityInput) {
        return;
    }

    const name = nameInput.value.trim();
    const category = categoryInput.value;
    const location = locationInput.value;
    const capacity = capacityInput.value.trim();

    if (!name || !category || !location || !capacity) {
        alert('Semua field bertanda * wajib diisi!');
        return;
    }

    if (parseInt(capacity, 10) <= 0) {
        alert('Kapasitas harus berupa angka lebih dari 0!');
        return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('category', category);
    formData.append('location', location);
    formData.append('capacity', capacity);
    if (addressInput && addressInput.value.trim()) {
        formData.append('address', addressInput.value.trim());
    }
    if (fileInput && fileInput.files[0]) {
        formData.append('image', fileInput.files[0]);
    }

    try {
        const response = await fetch(`${API_BASE}/api/admin/facilities`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || 'Gagal menambahkan fasilitas.');
            return;
        }

        alert(`Fasilitas "${name}" berhasil ditambahkan!`);
        
        nameInput.value = '';
        categoryInput.value = '';
        locationInput.value = '';
        capacityInput.value = '';
        if (addressInput) addressInput.value = '';
        if (fileInput) fileInput.value = '';
        
        closeModal('modal-add-facility');
        loadAdminData();
    } catch (e) {
        console.error('Add facility error:', e);
        alert('Terjadi kesalahan saat menambahkan fasilitas.');
    }
}

async function submitEditFacility() {
    const nameInput = document.getElementById('edit-facility-name');
    const categoryInput = document.getElementById('edit-facility-category');
    const locationInput = document.getElementById('edit-facility-location');
    const capacityInput = document.getElementById('edit-facility-capacity');
    const addressInput = document.getElementById('edit-facility-address');
    const fileInput = document.querySelector('#modal-edit-facility input[type="file"]');

    if (!nameInput || !capacityInput) {
        return;
    }

    const name = nameInput.value.trim();
    const category = categoryInput.value;
    const location = locationInput.value;
    const capacity = capacityInput.value;
    const address = addressInput ? addressInput.value.trim() : '';

    if (!name || !capacity) {
        alert('Nama fasilitas dan kapasitas wajib diisi!');
        return;
    }

    const facId = currentEditingFacilityId || (currentEditingRowId ? currentEditingRowId.replace('fac-', '') : null);
    if (!facId) return;

    const formData = new FormData();
    formData.append('name', name);
    formData.append('category', category);
    formData.append('location', location);
    formData.append('capacity', capacity);
    formData.append('address', address);
    if (fileInput && fileInput.files[0]) {
        formData.append('image', fileInput.files[0]);
    }

    try {
        const response = await fetch(`${API_BASE}/api/admin/facilities/${facId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            body: formData
        });

        const data = await response.json();
        if (!response.ok) {
            alert(data.message || 'Gagal memperbarui fasilitas.');
            return;
        }

        alert(`Data fasilitas "${name}" berhasil diperbarui!`);
        closeModal('modal-edit-facility');
        loadAdminData();
    } catch (e) {
        console.error('Edit facility error:', e);
    }
}

async function toggleFacilityStatus(rowId, facilityName, facilityId = null) {
    const row = document.getElementById(rowId);
    if (!row) return;

    const facId = facilityId || row.dataset.facilityId || rowId.replace('fac-', '');
    const badge = row.querySelector('.badge');
    const isCurrentlyActive = badge && badge.innerText.includes('Aktif');

    const confirmMsg = isCurrentlyActive 
        ? `Nonaktifkan "${facilityName}"?\nFasilitas ini di-nonaktifkan.`
        : `Aktifkan kembali "${facilityName}"?`;

    if (!confirm(confirmMsg)) return;

    try {
        const response = await fetch(`${API_BASE}/api/admin/facilities/${facId}/toggle-status`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        const data = await response.json();
        if (!response.ok) {
            alert(data.message || 'Gagal mengubah status fasilitas.');
            return;
        }

        alert(data.message);
        loadAdminData();
    } catch (e) {
        console.error('Toggle facility error:', e);
    }
}

// User / Account Management (US 13, US 14, US 15)
function detectRole() {
    const emailInput = document.getElementById('user-email');
    const roleBox = document.getElementById('detected-role');
    if (!emailInput || !roleBox) {
        return;
    }

    const email = emailInput.value.toLowerCase();
    
    if (email.includes('@students.undip.ac.id')) {
        roleBox.innerText = 'Mahasiswa';
        roleBox.className = 'form-input detected-role-box role-primary';
    } else if (email.includes('@lectures.undip.ac.id')) {
        roleBox.innerText = 'Dosen';
        roleBox.className = 'form-input detected-role-box role-success';
    } else if (email.includes('@staff.undip.ac.id')) {
        roleBox.innerText = 'Staf Akademik';
        roleBox.className = 'form-input detected-role-box role-warning';
    } else if (email.includes('@facility.undip.ac.id') || email.includes('@facillity.undip.ac.id') || email.includes('@officer.undip.ac.id')) {
        roleBox.innerText = 'Petugas';
        roleBox.className = 'form-input detected-role-box role-danger';
    } else if (email.includes('@admin.undip.ac.id')) {
        roleBox.innerText = 'Administrator';
        roleBox.className = 'form-input detected-role-box role-danger';
    } else if (email.length > 5) {
        roleBox.innerText = 'Domain tidak dikenali';
        roleBox.className = 'form-input detected-role-box role-default';
    } else {
        roleBox.innerText = 'Menunggu input email...';
        roleBox.className = 'form-input detected-role-box role-muted';
    }
}

async function submitAddUser() {
    const nameInput = document.getElementById('user-name');
    const nimInput = document.getElementById('user-nim');
    const emailInput = document.getElementById('user-email');
    const roleBox = document.getElementById('detected-role');

    if (!nameInput || !nimInput || !emailInput || !roleBox) {
        return;
    }

    const name = nameInput.value.trim();
    const nim = nimInput.value.trim();
    const email = emailInput.value.trim();
    const role = roleBox.innerText;

    if (!name || !nim || !email) {
        alert('Semua field bertanda * wajib diisi!');
        return;
    }

    if (role.includes('Menunggu') || role.includes('tidak dikenali')) {
        alert('Pendaftaran ditolak! Harap gunakan format email resmi institusi yang valid.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/admin/users`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                identity_number: nim,
                email: email
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || 'Gagal mendaftarkan akun.');
            return;
        }

        alert(data.message);
        
        nameInput.value = '';
        nimInput.value = '';
        emailInput.value = '';
        roleBox.innerText = 'Menunggu input email...';
        roleBox.className = 'form-input detected-role-box role-muted';

        closeModal('modal-add-user');
        loadAdminData();
    } catch (e) {
        console.error('Submit user error:', e);
        alert('Terjadi kesalahan saat mendaftarkan akun.');
    }
}

async function verifyAccount(rowId, userName, userId = null) {
    const uId = userId || rowId.replace('acc-', '');

    try {
        const response = await fetch(`${API_BASE}/api/admin/users/${uId}/verify`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        const data = await response.json();
        if (!response.ok) {
            alert(data.message || 'Gagal menyetujui akun.');
            return;
        }

        alert(`Akun pengguna ${userName} berhasil diverifikasi dan aktif.`);
        loadAdminData();
    } catch (e) {
        console.error('Verify error:', e);
    }
}

async function rejectAccount(rowId, userId = null) {
    const uId = userId || rowId.replace('acc-', '');
    const reason = prompt('Masukkan alasan penolakan pendaftaran akun:');
    if (reason === null || reason.trim() === '') return;

    try {
        const response = await fetch(`${API_BASE}/api/admin/users/${uId}/reject`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ reason: reason })
        });

        const data = await response.json();
        if (!response.ok) {
            alert(data.message || 'Gagal menolak akun.');
            return;
        }

        alert('Pendaftaran akun ditolak dan dihapus dari antrean.');
        loadAdminData();
    } catch (e) {
        console.error('Reject account error:', e);
    }
}

async function toggleAccountStatus(rowId, userName, userId = null) {
    const uId = userId || rowId.replace('acc-', '');
    const row = document.getElementById(rowId);
    if (!row) return;

    const badge = row.querySelector('.badge');
    const isCurrentlyActive = badge && badge.innerText.includes('Aktif');

    const confirmMsg = isCurrentlyActive
        ? `Cabut akses akun "${userName}"?\nPengguna tidak akan dapat login ke sistem.`
        : `Aktifkan kembali akses akun "${userName}"?`;

    if (!confirm(confirmMsg)) return;

    try {
        const response = await fetch(`${API_BASE}/api/admin/users/${uId}/toggle-status`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        const data = await response.json();
        if (!response.ok) {
            alert(data.message || 'Gagal mengubah status akun.');
            return;
        }

        alert(data.message);
        loadAdminData();
    } catch (e) {
        console.error('Toggle account error:', e);
    }
}

// Rekapitulasi & Export (US 17)
function exportData(format) {
    alert(`Mempersiapkan data rekapitulasi fasilitas...\nBerkas laporan dengan format [.${format}] akan mulai diunduh.`);
    window.location.href = `${API_BASE}/api/admin/export/${format.toLowerCase()}`;
}

// Table Filter
function filterTable(inputId, tableId) {
    const input = document.getElementById(inputId);
    const table = document.getElementById(tableId);
    
    if (!input || !table) return;

    const filter = input.value.toLowerCase().trim();
    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    const tr = tbody.getElementsByTagName('tr');
    let matchFound = false;

    for (let i = 0; i < tr.length; i++) {
        if (tr[i].classList.contains('no-result-row')) continue;

        let visible = false;
        const td = tr[i].getElementsByTagName('td');
        
        for (let j = 0; j < td.length; j++) {
            if (td[j]) {
                const textValue = (td[j].textContent || td[j].innerText).toLowerCase();
                if (textValue.includes(filter)) {
                    visible = true;
                    break;
                }
            }
        }
        
        if (visible) {
            tr[i].classList.remove('hidden');
            matchFound = true;
        } else {
            tr[i].classList.add('hidden');
        }
    }

    let noResultRow = tbody.querySelector('.no-result-row');
    if (!matchFound) {
        const colCount = table.querySelectorAll('thead th').length;
        if (!noResultRow) {
            noResultRow = document.createElement('tr');
            noResultRow.className = 'no-result-row';
            const cell = document.createElement('td');
            cell.colSpan = colCount;
            cell.className = 'text-center text-muted no-result-cell';
            cell.innerHTML = `Data untuk pencarian <strong>"${input.value}"</strong> tidak ditemukan.`;
            noResultRow.appendChild(cell);
            tbody.appendChild(noResultRow);
        } else {
            const cell = noResultRow.querySelector('td');
            if (cell) {
                cell.colSpan = colCount;
                cell.innerHTML = `Data untuk pencarian <strong>"${input.value}"</strong> tidak ditemukan.`;
            }
            noResultRow.classList.remove('hidden');
        }
    } else if (noResultRow) {
        noResultRow.classList.add('hidden');
    }
}

// Load real data from Backend for Admin
async function loadAdminData() {
    try {
        // 1. Facilities Table
        const facRes = await fetch(`${API_BASE}/api/facilities`);
        if (facRes.ok) {
            const facJson = await facRes.json();
            const facilities = facJson.data || [];
            const facTbody = document.querySelector('#table-facilities tbody');

            if (facTbody) {
                facTbody.innerHTML = '';
                facilities.forEach(fac => {
                    const rowId = `fac-${fac.id}`;
                    const isActive = fac.status === 'active';
                    const badgeClass = isActive ? 'badge success' : 'badge neutral';
                    const badgeText = isActive ? 'Aktif' : (fac.status === 'maintenance' ? 'Dalam Perbaikan' : 'Nonaktif');
                    const toggleBtnClass = isActive ? 'button button-danger button-fixed' : 'button button-primary button-fixed';
                    const toggleBtnText = isActive ? 'Nonaktifkan' : 'Aktifkan';

                    const tr = document.createElement('tr');
                    tr.id = rowId;
                    tr.dataset.facilityId = fac.id;
                    tr.innerHTML = `
                        <td><div class="font-bold">${fac.name}</div></td>
                        <td>${fac.type}</td>
                        <td>${fac.location}</td>
                        <td>${fac.capacity} Orang</td>
                        <td><span class="${badgeClass}">${badgeText}</span></td>
                        <td class="text-center">
                            <div class="action-buttons">
                                <button class="button button-outline button-fixed" onclick="openEditModal('${rowId}', '${fac.name.replace(/'/g, "\\'")}', '${fac.type}', '${fac.location}', ${fac.capacity}, '${(fac.address || '').replace(/'/g, "\\'")}', '${fac.image_name || ''}', ${fac.id})">Edit</button>
                                <button class="${toggleBtnClass}" onclick="toggleFacilityStatus('${rowId}', '${fac.name.replace(/'/g, "\\'")}', ${fac.id})">${toggleBtnText}</button>
                            </div>
                        </td>
                    `;
                    facTbody.appendChild(tr);
                });
            }
        }

        // 2. Accounts Table
        const userRes = await fetch(`${API_BASE}/api/admin/users`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (userRes.ok) {
            const userJson = await userRes.json();
            const users = userJson.data || [];
            const userTbody = document.querySelector('#table-accounts tbody');

            const pendingBadge = document.getElementById('badge-pending-accounts');
            if (pendingBadge) {
                pendingBadge.textContent = userJson.pending_count || 0;
            }

            if (userTbody) {
                userTbody.innerHTML = '';
                users.forEach(u => {
                    const rowId = u.row_id;
                    const isPending = u.status === 'pending';
                    const isActive = ['aktif', 'active'].includes(u.status);

                    let actionHtml = '';
                    if (isPending) {
                        actionHtml = `
                            <div class="action-buttons">
                                <button class="button button-primary button-fixed" onclick="verifyAccount('${rowId}', '${u.name.replace(/'/g, "\\'")}', ${u.id})">Setujui</button>
                                <button class="button button-outline button-fixed" onclick="rejectAccount('${rowId}', ${u.id})">Tolak</button>
                            </div>
                        `;
                    } else if (isActive) {
                        actionHtml = `<button class="button button-danger button-fixed" onclick="toggleAccountStatus('${rowId}', '${u.name.replace(/'/g, "\\'")}', ${u.id})">Cabut Akses</button>`;
                    } else {
                        actionHtml = `<button class="button button-primary button-fixed" onclick="toggleAccountStatus('${rowId}', '${u.name.replace(/'/g, "\\'")}', ${u.id})">Aktifkan Akses</button>`;
                    }

                    const tr = document.createElement('tr');
                    tr.id = rowId;
                    tr.dataset.userId = u.id;
                    tr.innerHTML = `
                        <td>
                            <div class="font-bold">${u.name}</div>
                            <div class="text-small text-muted">${u.email}</div>
                        </td>
                        <td>${u.identity_number}</td>
                        <td><span class="text-accent">${u.role_label}</span></td>
                        <td><span class="badge ${u.status_badge}">${u.status_text}</span></td>
                        <td class="text-center">${actionHtml}</td>
                    `;
                    userTbody.appendChild(tr);
                });
            }
        }

        // 3. Rekapitulasi Table & Stats
        const rekapRes = await fetch(`${API_BASE}/api/admin/rekap`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (rekapRes.ok) {
            const rekapJson = await rekapRes.json();
            const summary = rekapJson.summary;
            const rekapFacilities = rekapJson.facilities || [];

            // Stats values
            const statValues = document.querySelectorAll('#tab-reports .stat-value');
            if (statValues.length >= 3) {
                statValues[0].textContent = summary.average_occupancy;
                statValues[1].textContent = summary.total_hours;
                statValues[2].textContent = summary.total_damages;
            }

            // Rekap table
            const rekapTbody = document.querySelector('#tab-reports .data-table tbody');
            if (rekapTbody) {
                rekapTbody.innerHTML = '';
                rekapFacilities.forEach(fac => {
                    const dmgBadgeClass = fac.damage_count > 0 ? 'badge danger' : 'badge neutral';
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><div class="font-bold">${fac.name}</div></td>
                        <td>${fac.location}</td>
                        <td>${fac.total_bookings_label}</td>
                        <td>${fac.occupancy_label}</td>
                        <td><span class="${dmgBadgeClass}">${fac.damage_label}</span></td>
                    `;
                    rekapTbody.appendChild(tr);
                });
            }
        }
    } catch (e) {
        console.error('Load admin data error:', e);
    }
}

loadAdminData();