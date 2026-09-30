const token = localStorage.getItem("auth_token");

if (!token) {
    window.location.href = "login.html";
}

const reservationDetailOverlay = document.querySelector("#reservation-detail-overlay");
const reservationDetailClose = document.querySelector("#reservation-detail-close");
const reservationDetailCancel = document.querySelector("#reservation-detail-cancel");
const reservationCancelButton = document.querySelector("#reservation-cancel-button");

const detailFacility = document.querySelector("#detail-facility");
const detailFacilityName = document.querySelector("#detail-facility-name");
const detailDate = document.querySelector("#detail-date");
const detailTime = document.querySelector("#detail-time");
const detailPurpose = document.querySelector("#detail-purpose");
const detailStatus = document.querySelector("#detail-status");
const detailFile = document.querySelector("#detail-file");
const detailSubmitted = document.querySelector("#detail-submitted");
const detailCancellationDeadline = document.querySelector("#detail-cancellation-deadline");

const tableBody = document.querySelector(".reservations-table tbody");
let selectedReservationButton = null;
let currentReservationId = null;

function openReservationDetail(button) {
    selectedReservationButton = button;
    currentReservationId = button.dataset.id;

    const facility = button.dataset.facility;
    const date = button.dataset.date;
    const time = button.dataset.time;
    const purpose = button.dataset.purpose;
    const status = button.dataset.status;
    const statusClass = button.dataset.statusClass;
    const file = button.dataset.file;
    const submitted = button.dataset.submitted;
    const cancellationDeadline = button.dataset.cancellationDeadline;

    detailFacility.textContent = facility;
    detailFacilityName.textContent = facility;
    detailDate.textContent = date;
    detailTime.textContent = time;
    detailPurpose.textContent = purpose;
    detailStatus.textContent = status;
    detailFile.textContent = file;
    detailSubmitted.textContent = submitted;
    detailCancellationDeadline.textContent = cancellationDeadline ? formatDateTime(cancellationDeadline) : "-";

    detailStatus.className = "status-" + statusClass;

    updateCancellationButton(statusClass, cancellationDeadline);

    reservationDetailOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
}

function updateCancellationButton(statusClass, cancellationDeadline) {
    const allowedStatuses = ["pending", "approved"];
    if (!allowedStatuses.includes(statusClass)) {
        reservationCancelButton.style.display = "none";
        return;
    }

    if (!cancellationDeadline) {
        reservationCancelButton.style.display = "inline-flex";
        return;
    }

    const deadline = new Date(cancellationDeadline);
    const now = new Date();
    if (now <= deadline) {
        reservationCancelButton.style.display = "inline-flex";
    } else {
        reservationCancelButton.style.display = "none";
    }
}

async function cancelReservation() {
    if (!selectedReservationButton) {
        return;
    }

    const confirmed = confirm(
        "Apakah kamu yakin ingin membatalkan reservasi ini?"
    );
    if (!confirmed) {
        return;
    }

    const reservationId = currentReservationId || selectedReservationButton.dataset.id;

    try {
        const response = await fetch(`/api/reservations/${reservationId}/cancel`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                reason: "Dibatalkan oleh pemohon."
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Gagal membatalkan reservasi.");
            return;
        }

        selectedReservationButton.dataset.status = "Dibatalkan";
        selectedReservationButton.dataset.statusClass = "cancelled";

        const row = selectedReservationButton.closest("tr");
        if (row) {
            const statusElement = row.querySelector(".reservation-status");
            if (statusElement) {
                statusElement.textContent = "Dibatalkan";
                statusElement.className = "reservation-status reservation-status-cancelled";
            }
        }

        detailStatus.textContent = "Dibatalkan";
        detailStatus.className = "status-cancelled";

        reservationCancelButton.style.display = "none";
        alert("Reservasi berhasil dibatalkan.");
        loadReservations();
    } catch (err) {
        console.error("Cancel error:", err);
        alert("Terjadi kesalahan saat menghubungi server.");
    }
}

function closeReservationDetail() {
    reservationDetailOverlay.classList.remove("active");
    document.body.style.overflow = "";
    selectedReservationButton = null;
    currentReservationId = null;
}

function formatDateTime(dateTime) {
    if (!dateTime) return "-";
    const date = new Date(dateTime);
    if (isNaN(date.getTime())) return dateTime;

    return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric"
    }) + ", " + date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    });
}

async function loadReservations() {
    if (!tableBody) return;
    try {
        const response = await fetch("/api/user/reservations", {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json"
            }
        });

        if (!response.ok) return;

        const result = await response.json();
        const reservations = result.data || [];

        tableBody.innerHTML = "";

        if (reservations.length === 0) {
            const tr = document.createElement("tr");
            tr.innerHTML = `<td colspan="6" style="text-align: center; color: #64748b; padding: 24px;">Belum ada pengajuan reservasi.</td>`;
            tableBody.appendChild(tr);
            return;
        }

        reservations.forEach(res => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>
                    <div class="reservation-facility">
                        <strong>${res.facility}</strong>
                        <span>${res.facility_category || 'Fasilitas Kampus'}</span>
                    </div>
                </td>
                <td>${res.date}</td>
                <td>${res.time}</td>
                <td>${res.purpose}</td>
                <td><span class="reservation-status reservation-status-${res.status_class}">${res.status}</span></td>
                <td>
                    <button type="button" class="reservation-table-action reservation-detail-button"
                        data-id="${res.id}"
                        data-facility="${res.facility}"
                        data-date="${res.date}"
                        data-time="${res.time}"
                        data-purpose="${res.purpose}"
                        data-status="${res.status}"
                        data-status-class="${res.status_class}"
                        data-file="${res.file}"
                        data-submitted="${res.submitted}"
                        data-cancellation-deadline="${res.cancellation_deadline || ''}">
                        Lihat
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        tableBody.querySelectorAll(".reservation-detail-button").forEach(button => {
            button.addEventListener("click", function () {
                openReservationDetail(button);
            });
        });
    } catch (e) {
        console.error("Load reservations error:", e);
    }
}

reservationCancelButton.addEventListener("click", cancelReservation);
reservationDetailClose.addEventListener("click", closeReservationDetail);
reservationDetailCancel.addEventListener("click", closeReservationDetail);

reservationDetailOverlay.addEventListener("click", function (event) {
    if (event.target === reservationDetailOverlay) {
        closeReservationDetail();
    }
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeReservationDetail();
    }
});

loadReservations();