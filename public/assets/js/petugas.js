const token = localStorage.getItem("auth_token");
const user = JSON.parse(localStorage.getItem("user") || "null");
const API_BASE = (window.location.protocol === "file:" || (window.location.port && window.location.port !== "8000")) ? "http://127.0.0.1:8000" : "";

if (!token || !user || !["petugas", "admin"].includes(user.role)) {
    window.location.href = "login.html";
}

// User Profile in Sidebar
const profileName = document.querySelector(".sidebar-footer .user-info p");
const profileRole = document.querySelector(".sidebar-footer .user-info span");
const profileAvatar = document.querySelector(".sidebar-footer .user-avatar");
if (user && user.name) {
    if (profileName) profileName.textContent = user.name;
    if (profileRole) profileRole.textContent = user.role === "admin" ? "Admin" : "Petugas";
    if (profileAvatar) {
        const initials = user.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
        profileAvatar.textContent = initials;
    }
}

// Global data stores
let reservationsMap = {};
let damageReportsMap = {};
let currentReservationId = null;
let currentReservationRowId = null;
let currentDamageId = null;
let currentDamageRowId = null;

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });

    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.classList.remove('hidden');
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

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
}

function resetFormInputs() {
    document.querySelectorAll('.modal-form textarea').forEach(textarea => {
        textarea.value = '';
    });
}

function filterTable(inputId, tableId) {
    const input = document.getElementById(inputId);
    const table = document.getElementById(tableId);
    
    if (!input || !table) {
        return;
    }

    const filter = input.value.toLowerCase().trim();
    const tbody = table.querySelector('tbody');
    if (!tbody) {
        return;
    }

    const tr = tbody.getElementsByTagName('tr');
    let matchFound = false;

    for (let i = 0; i < tr.length; i++) {
        if (tr[i].classList.contains('no-result-row')) {
            continue;
        }

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

// Reservation Detail & Actions
function openReservationDetail(rowId, status, reasonText = "") {
    const modal = document.getElementById('modal-reservation-detail');
    const data = reservationsMap[rowId];

    if (!data || !modal) {
        return;
    }

    currentReservationId = data.id;
    currentReservationRowId = rowId;

    document.getElementById('detail-user-name').textContent = data.name;
    document.getElementById('detail-user-id').textContent = data.nim;
    document.getElementById('detail-user-role').textContent = data.role;
    document.getElementById('detail-user-phone').textContent = data.phone;
    document.getElementById('detail-user-email').textContent = data.email;
    document.getElementById('detail-facility').textContent = data.facility;
    document.getElementById('detail-dates').textContent = data.dates;
    document.getElementById('detail-times').textContent = data.times;
    document.getElementById('detail-purpose').textContent = data.purpose;
    document.getElementById('detail-filename').textContent = data.filename;
    const fileLink = document.getElementById('detail-file-link');
    if (fileLink) { fileLink.href = data.file_url || "#"; fileLink.classList.toggle('hidden', !data.file_url); }

    const reasonBox = document.getElementById('detail-reason-box');
    const reasonMsg = document.getElementById('detail-reason-text');
    const actionReject = document.getElementById('btn-modal-reject');
    const actionApprove = document.getElementById('btn-modal-approve');
    const actionCancel = document.getElementById('btn-modal-cancel');

    reasonBox.classList.add('hidden');
    actionReject.classList.add('hidden');
    actionApprove.classList.add('hidden');
    actionCancel.classList.add('hidden');

    if (status === 'Menunggu' || data.status_class === 'pending') {
        actionReject.classList.remove('hidden');
        actionApprove.classList.remove('hidden');
    } else if (status === 'Disetujui' || data.status_class === 'approved') {
        actionCancel.classList.remove('hidden');
    } else if (status === 'Ditolak' || status === 'Dibatalkan' || ['rejected', 'cancelled'].includes(data.status_class)) {
        reasonBox.classList.remove('hidden');
        reasonMsg.textContent = data.rejection_reason || data.cancellation_reason || reasonText || "Tidak ada alasan yang dicantumkan.";
    }

    modal.classList.remove('hidden');
}

async function approveFromModal() {
    if (!currentReservationId) return;

    try {
        const response = await fetch(`${API_BASE}/api/petugas/reservations/${currentReservationId}/approve`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Gagal menyetujui reservasi.");
            return;
        }

        alert("Pengajuan reservasi berhasil disetujui!");
        closeModal('modal-reservation-detail');
        await loadPetugasData();
    } catch (e) {
        console.error("Approve error:", e);
        alert("Terjadi kesalahan saat menyetujui reservasi.");
    }
}

function rejectFromModal() {
    closeModal('modal-reservation-detail');
    document.getElementById('modal-reject').classList.remove('hidden');
}

async function confirmReject() {
    if (!currentReservationId) return;
    const reasonInput = document.getElementById('reject-reason');
    if (!reasonInput || reasonInput.value.trim() === '') {
        alert('Alasan penolakan wajib diisi!');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/petugas/reservations/${currentReservationId}/reject`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                reason: reasonInput.value.trim()
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Gagal menolak reservasi.");
            return;
        }

        alert(`Pengajuan berhasil ditolak.\nAlasan: ${reasonInput.value}`);
        closeModal('modal-reject');
        resetFormInputs();
        await loadPetugasData();
    } catch (e) {
        console.error("Reject error:", e);
        alert("Terjadi kesalahan saat menolak reservasi.");
    }
}

function openEmergencyFromDetail() {
    closeModal('modal-reservation-detail');
    document.getElementById('modal-emergency').classList.remove('hidden');
}

async function confirmEmergency() {
    if (!currentReservationId) return;
    const reasonInput = document.getElementById('emergency-reason');
    if (!reasonInput || reasonInput.value.trim() === '') {
        alert('Alasan pembatalan darurat wajib diisi!');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/petugas/reservations/${currentReservationId}/emergency-cancel`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                reason: reasonInput.value.trim()
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Gagal melakukan pembatalan darurat.");
            return;
        }

        alert(`Pembatalan darurat berhasil dikirim.\nAlasan: ${reasonInput.value}`);
        closeModal('modal-emergency');
        resetFormInputs();
        await loadPetugasData();
    } catch (e) {
        console.error("Emergency cancel error:", e);
        alert("Terjadi kesalahan saat pembatalan darurat.");
    }
}

// Damage Report Detail & Actions
function openDamageDetail(rowId, status) {
    const modal = document.getElementById('modal-damage-detail');
    const data = damageReportsMap[rowId];

    if (!data || !modal) {
        return;
    }
    currentDamageRowId = rowId;
    currentDamageId = data.id;

    document.getElementById('dmg-user-name').textContent = data.name;
    document.getElementById('dmg-category').textContent = data.category;
    document.getElementById('dmg-facility').textContent = data.facility;
    document.getElementById('dmg-location').textContent = data.location;
    document.getElementById('dmg-description').textContent = data.description;
    document.getElementById('dmg-photo').textContent = data.photo;

    const resBox = document.getElementById('dmg-resolution-box');
    const resMsg = document.getElementById('dmg-resolution-text');
    const rejBox = document.getElementById('dmg-reject-box');
    const rejMsg = document.getElementById('dmg-reject-text');

    const actionProcess = document.getElementById('btn-dmg-process');
    const actionResolve = document.getElementById('btn-dmg-resolve');
    const actionReject = document.getElementById('btn-dmg-reject');

    resBox.classList.add('hidden');
    rejBox.classList.add('hidden');
    actionProcess?.classList.add('hidden');
    actionResolve?.classList.add('hidden');
    actionReject?.classList.add('hidden');

    if (status === 'Baru' || data.status_class === 'baru') {
        actionProcess?.classList.remove('hidden');
        actionReject?.classList.remove('hidden');
    } else if (status === 'Diproses' || data.status_class === 'diproses') {
        actionResolve?.classList.remove('hidden');
    } else if (status === 'Selesai' || data.status_class === 'selesai') {
        resBox.classList.remove('hidden');
        resMsg.textContent = data.resolution || "-";
    } else if (status === 'Ditolak' || data.status_class === 'ditolak') {
        rejBox.classList.remove('hidden');
        rejMsg.textContent = data.rejectReason || "-";
    }

    modal.classList.remove('hidden');
}

async function processDamageFromModal() {
    if (!currentDamageId) return;

    try {
        const response = await fetch(`${API_BASE}/api/petugas/damage-reports/${currentDamageId}/status`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                status: "diproses"
            })
        });

        if (!response.ok) {
            alert("Gagal memperbarui status laporan.");
            return;
        }

        alert("Status laporan diubah menjadi SEDANG DIPROSES. Tim teknisi telah dikerahkan.");
        closeModal('modal-damage-detail');
        await loadPetugasData();
    } catch (e) {
        console.error("Process damage error:", e);
    }
}

function openResolutionFromDetail() {
    closeModal('modal-damage-detail');
    document.getElementById('modal-resolution').classList.remove('hidden');
}

async function confirmResolution() {
    if (!currentDamageId) return;
    const noteInput = document.getElementById('resolution-note');
    if (!noteInput || noteInput.value.trim() === '') {
        alert('Catatan resolusi teknis wajib diisi sebelum menutup laporan!');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/petugas/damage-reports/${currentDamageId}/status`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                status: "selesai",
                resolution_note: noteInput.value.trim()
            })
        });

        if (!response.ok) {
            alert("Gagal menyelesaikan laporan.");
            return;
        }

        alert('Laporan Kerusakan berhasil ditutup dengan status SELESAI.');
        closeModal('modal-resolution');
        resetFormInputs();
        await loadPetugasData();
    } catch (e) {
        console.error("Resolve error:", e);
    }
}

function rejectDamageFromModal() {
    closeModal('modal-damage-detail');
    document.getElementById('modal-damage-reject').classList.remove('hidden');
}

async function confirmDamageReject() {
    if (!currentDamageId) return;
    const reasonInput = document.getElementById('damage-reject-reason');
    if (!reasonInput || reasonInput.value.trim() === '') {
        alert('Alasan penolakan laporan wajib diisi!');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/petugas/damage-reports/${currentDamageId}/status`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                status: "ditolak",
                reject_reason: reasonInput.value.trim()
            })
        });

        if (!response.ok) {
            alert("Gagal menolak laporan.");
            return;
        }

        alert(`Laporan berhasil ditolak.\nAlasan: ${reasonInput.value}`);
        closeModal('modal-damage-reject');
        resetFormInputs();
        await loadPetugasData();
    } catch (e) {
        console.error("Reject damage error:", e);
    }
}

// Facility Maintenance Toggle (US 12)
async function toggleMaintenance(rowId, facilityId) {
    const row = document.getElementById(rowId);
    if (!row) return;

    const facId = facilityId || row.dataset.facilityId || (rowId.startsWith('row-ops-') ? rowId.replace('row-ops-', '') : rowId.replace(/\D/g, ''));
    if (!facId) return;

    try {
        const response = await fetch(`${API_BASE}/api/petugas/facilities/${facId}/maintenance`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json"
            }
        });

        const data = await response.json();
        if (!response.ok) {
            alert(data.message || "Gagal mengubah status fasilitas.");
            return;
        }

        const badge = row.querySelector('.badge');
        const actionButton = row.querySelector('button');
        const isMaint = ['maintenance', 'dalam perbaikan'].includes((data.facility.status || '').toLowerCase());

        if (isMaint) {
            if (badge) {
                badge.className = 'badge danger';
                badge.innerText = 'Dalam Perbaikan';
            }
            if (actionButton) {
                actionButton.className = 'button button-primary button-small';
                actionButton.innerText = 'Aktifkan Kembali';
            }
            alert('Status diubah ke DALAM PERBAIKAN.\nSeluruh slot kalender publik pada fasilitas ini otomatis terkunci.');
        } else {
            if (badge) {
                badge.className = 'badge success';
                badge.innerText = 'Aktif Normal';
            }
            if (actionButton) {
                actionButton.className = 'button button-outline button-small';
                actionButton.innerText = 'Set "Perbaikan"';
            }
            alert('Fasilitas telah DIAKTIFKAN KEMBALI.\nPeminjaman publik dapat diajukan kembali.');
        }

        await loadPetugasData();
    } catch (e) {
        console.error("Toggle maintenance error:", e);
    }
}

// Load real data from Backend for Petugas
async function loadPetugasData() {
    try {
        // 1. Dashboard summary & stats (US 8)
        const dashRes = await fetch(`${API_BASE}/api/petugas/dashboard`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json"
            }
        });

        if (dashRes.ok) {
            const dashData = await dashRes.json();
            const stats = dashData.stats;

            // Stat Cards
            const statPending = document.getElementById("stat-pending");
            if (statPending) statPending.textContent = stats.pending_queue;

            const statCards = document.querySelectorAll(".stats-grid .stat-card h3");
            if (statCards.length >= 4) {
                statCards[0].textContent = stats.pending_queue;
                statCards[1].textContent = stats.new_reports;
                statCards[2].textContent = stats.processing_reports;
                statCards[3].textContent = stats.maintenance_facilities;
            }

            const badgeQueue = document.getElementById("badge-queue-count");
            if (badgeQueue) badgeQueue.textContent = stats.pending_queue;

            // Maintenance Table
            const maintTable = document.querySelector("#table-maintenance tbody");
            if (maintTable && dashData.facilities) {
                maintTable.innerHTML = "";
                dashData.facilities.forEach((fac, idx) => {
                    const rowId = `row-ops-${fac.id}`;
                    const isMaint = ['maintenance', 'dalam perbaikan'].includes((fac.status || '').toLowerCase());
                    const badgeClass = isMaint ? "badge danger" : "badge success";
                    const badgeText = isMaint ? "Dalam Perbaikan" : "Aktif Normal";
                    const btnClass = isMaint ? "button button-primary button-small" : "button button-outline button-small";
                    const btnText = isMaint ? "Aktifkan Kembali" : 'Set "Perbaikan"';

                    const tr = document.createElement("tr");
                    tr.id = rowId;
                    tr.dataset.facilityId = fac.id;
                    tr.innerHTML = `
                        <td><div class="font-bold">${fac.name}</div></td>
                        <td>${fac.location}</td>
                        <td><span class="${badgeClass}">${badgeText}</span></td>
                        <td class="text-center"><button class="${btnClass}" onclick="toggleMaintenance('${rowId}', ${fac.id})">${btnText}</button></td>
                    `;
                    maintTable.appendChild(tr);
                });
            }
        }

        // 2. Queue Reservations + Damage Reports (US 8)
        const requestHeaders = {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        };
        const [queueRes, dmgRes] = await Promise.all([
            fetch(`${API_BASE}/api/petugas/queue`, { headers: requestHeaders }),
            fetch(`${API_BASE}/api/petugas/damage-reports`, { headers: requestHeaders })
        ]);

        if (queueRes.ok) {
            const queueData = await queueRes.json();
            const queue = queueData.data || [];
            const queueTable = document.querySelector("#table-queue tbody");

            reservationsMap = {};
            if (queueTable) {
                queueTable.innerHTML = "";
                queue.forEach(res => {
                    reservationsMap[res.row_id] = res;

                    const badgeClass = matchBadge(res.status_class);
                    const btnClass = res.status_class === 'pending' ? 'button button-primary button-small' : 'button button-outline button-small';

                    const tr = document.createElement("tr");
                    tr.id = res.row_id;
                    tr.innerHTML = `
                        <td>
                            <div class="font-bold">${res.name}</div>
                            <div class="text-accent">${res.role}</div>
                        </td>
                        <td><div class="font-bold">${res.facility}</div></td>
                        <td>
                            <div class="font-bold">${res.dates}</div>
                            <div class="text-small text-muted">${res.times}</div>
                        </td>
                        <td><span class="badge ${badgeClass}">${res.status}</span></td>
                        <td class="text-center">
                            <button class="${btnClass}" onclick="openReservationDetail('${res.row_id}', '${res.status}')">
                                <span class="material-symbols-outlined icon-small">visibility</span> Detail
                            </button>
                        </td>
                    `;
                    queueTable.appendChild(tr);
                });
            }
        }

        // 3. Damage Reports Table (US 8)
        if (dmgRes.ok) {
            const dmgData = await dmgRes.json();
            const reports = dmgData.data || [];
            const dmgTable = document.querySelector("#table-damage tbody");

            damageReportsMap = {};
            if (dmgTable) {
                dmgTable.innerHTML = "";
                reports.forEach(rep => {
                    damageReportsMap[rep.row_id] = rep;

                    const badgeClass = matchBadge(rep.status_class);
                    const btnClass = rep.status_class === 'baru' ? 'button button-primary button-small' : 'button button-outline button-small';

                    const tr = document.createElement("tr");
                    tr.id = rep.row_id;
                    tr.innerHTML = `
                        <td>
                            <div class="font-bold">${rep.facility}</div>
                            <div class="text-small text-muted">Pelapor: ${rep.name}</div>
                        </td>
                        <td><span class="badge neutral">${rep.category}</span></td>
                        <td>${rep.description.length > 40 ? rep.description.substring(0, 40) + '...' : rep.description}</td>
                        <td><span class="badge ${badgeClass}">${rep.status}</span></td>
                        <td class="text-center">
                            <button class="${btnClass}" onclick="openDamageDetail('${rep.row_id}', '${rep.status}')">
                                <span class="material-symbols-outlined icon-small">visibility</span> Detail
                            </button>
                        </td>
                    `;
                    dmgTable.appendChild(tr);
                });
            }
        }
    } catch (e) {
        console.error("Petugas data load error:", e);
    }
}

function matchBadge(status) {
    const s = (status || '').toLowerCase();
    if (['pending', 'diproses', 'warning', 'menunggu_persetujuan'].includes(s)) return 'warning';
    if (['approved', 'selesai', 'success', 'disetujui'].includes(s)) return 'success';
    if (['rejected', 'ditolak', 'danger', 'dibatalkan'].includes(s)) return 'danger';
    return 'neutral';
}

loadPetugasData();