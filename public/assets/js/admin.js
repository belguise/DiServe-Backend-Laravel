function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });

    document.getElementById(tabId).classList.remove('hidden');

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


function toggleFacilityStatus(rowId, facilityName) {
    const row = document.getElementById(rowId);
    if (!row) {
        return;
    }

    const badge = row.querySelector('.badge');
    const actionBtn = row.querySelectorAll('.action-buttons button')[1];

    if (badge.innerText.includes('Aktif')) {
        if (confirm(`Nonaktifkan "${facilityName}"?\nFasilitas ini di-nonaktifkan`)) {
            badge.className = 'badge neutral';
            badge.innerText = 'Nonaktif';
            
            actionBtn.className = 'button button-primary button-fixed';
            actionBtn.innerText = 'Aktifkan';
            alert(`Fasilitas "${facilityName}" telah DINONAKTIFKAN.`);
        }
    } else {
        badge.className = 'badge success';
        badge.innerText = 'Aktif';
        
        actionBtn.className = 'button button-danger button-fixed';
        actionBtn.innerText = 'Nonaktifkan';
        alert(`Fasilitas "${facilityName}" telah DIAKTIFKAN KEMBALI.`);
    }
}


function toggleAccountStatus(rowId, userName) {
    const row = document.getElementById(rowId);
    if (!row) {
        return;
    }

    const badge = row.querySelector('.badge');
    const actionBtn = row.querySelector('.action-buttons button, td.text-center button');

    if (!badge || !actionBtn) {
        return;
    }

    if (badge.innerText.includes('Aktif')) {
        if (confirm(`Cabut akses akun "${userName}"?\nPengguna tidak akan dapat login ke sistem.`)) {
            badge.className = 'badge neutral';
            badge.innerText = 'Nonaktif';

            actionBtn.className = 'button button-primary button-fixed';
            actionBtn.innerText = 'Aktifkan Akses';
            alert(`Akses login untuk "${userName}" telah DICABUT.`);
        }
    } else {
        badge.className = 'badge success';
        badge.innerText = 'Aktif';

        actionBtn.className = 'button button-danger button-fixed';
        actionBtn.innerText = 'Cabut Akses';
        alert(`Akses login untuk "${userName}" telah DIAKTIFKAN KEMBALI.`);
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


let currentEditingRowId = '';
let currentEditingImage = '';


function openEditModal(rowId, name, category, location, capacity, address = '', imageFile = '') {
    currentEditingRowId = rowId;
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


function submitAddFacility() {
    const nameInput = document.getElementById('add-facility-name');
    const categoryInput = document.getElementById('add-facility-category');
    const locationInput = document.getElementById('add-facility-location');
    const capacityInput = document.getElementById('add-facility-capacity');
    const addressInput = document.getElementById('add-facility-address');

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

    alert(`Fasilitas "${name}" berhasil ditambahkan!`);
    
    nameInput.value = '';
    categoryInput.value = '';
    locationInput.value = '';
    capacityInput.value = '';
    if (addressInput) {
        addressInput.value = '';
    }
    
    closeModal('modal-add-facility');
}


function submitAddUser() {
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

    alert(`Akun berhasil didaftarkan!\n\nNama: ${name}\nIdentitas: ${nim}\nEmail: ${email}\nRole: ${role}`);
    
    nameInput.value = '';
    nimInput.value = '';
    emailInput.value = '';
    roleBox.innerText = 'Menunggu input email...';
    roleBox.className = 'form-input detected-role-box role-muted';

    closeModal('modal-add-user');
}


function submitEditFacility() {
    const nameInput = document.getElementById('edit-facility-name');
    const categoryInput = document.getElementById('edit-facility-category');
    const locationInput = document.getElementById('edit-facility-location');
    const capacityInput = document.getElementById('edit-facility-capacity');
    const addressInput = document.getElementById('edit-facility-address');

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

    const row = document.getElementById(currentEditingRowId);
    if (row) {
        row.cells[0].querySelector('.font-bold').innerText = name;
        row.cells[1].innerText = category;
        row.cells[2].innerText = location;
        row.cells[3].innerText = `${capacity} Orang`;

        const editBtn = row.querySelectorAll('.action-buttons button')[0];
        editBtn.setAttribute('onclick', `openEditModal('${currentEditingRowId}', '${name.replace(/'/g, "\\'")}', '${category}', '${location}', ${capacity}, '${address.replace(/'/g, "\\'")}', '${currentEditingImage}')`);
    }

    alert(`Data fasilitas "${name}" berhasil diperbarui!`);
    closeModal('modal-edit-facility');
}


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
    } else if (email.includes('@facility.undip.ac.id') || email.includes('@facillity.undip.ac.id')) {
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


function verifyAccount(rowId, userName) {
    alert(`Akun pengguna ${userName} berhasil diverifikasi dan aktif.`);
    const row = document.getElementById(rowId);
    if (row) {
        row.remove();
    }
    
    const badge = document.getElementById('badge-pending-accounts');
    if (badge) {
        let count = parseInt(badge.innerText, 10);
        if (count > 0) {
            badge.innerText = count - 1;
        }
    }
}


function rejectAccount(rowId) {
    const reason = prompt('Masukkan alasan penolakan pendaftaran akun:');
    if (reason !== null && reason.trim() !== '') {
        alert('Pendaftaran akun ditolak dan dihapus dari antrean.');
        const row = document.getElementById(rowId);
        if (row) {
            row.remove();
        }
        
        const badge = document.getElementById('badge-pending-accounts');
        if (badge) {
            let count = parseInt(badge.innerText, 10);
            if (count > 0) {
                badge.innerText = count - 1;
            }
        }
    }
}


function revokeAccess(rowId, roleType) {
    alert(`Akses login ${roleType} dicabut.`);
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


function exportData(format) {
    alert(`Mempersiapkan data rekapitulasi fasilitas...\nBerkas laporan dengan format [.${format}] akan mulai diunduh.`);
}