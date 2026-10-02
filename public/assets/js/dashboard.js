const token = localStorage.getItem("auth_token");
const storedUser = JSON.parse(localStorage.getItem("user") || "null");
const API_BASE = (window.location.protocol === "file:" || (window.location.port && window.location.port !== "8000")) ? "http://127.0.0.1:8000" : "";

if (!token || !storedUser || !["user", "pengguna"].includes(storedUser.role)) {
    window.location.replace("login.html");
}

const logoutButton = document.querySelector("#logout-button");
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

const reservationTableBody = document.querySelector("#reservation-table-body");
let selectedReservationButton = null;
let currentReservationId = null;

// User info rendering
const userNameElements = document.querySelectorAll(".dashboard-user-info strong, .dashboard-welcome h2");
if (storedUser && storedUser.name) {
    userNameElements.forEach(el => {
        if (el.tagName === "H2") {
            el.textContent = `Selamat datang kembali, ${storedUser.name.split(" ")[0]}`;
        } else {
            el.textContent = storedUser.name;
        }
    });
}

logoutButton.addEventListener("click", async function () {
    try {
        await fetch(`${API_BASE}/api/auth/logout`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json"
            }
        });
    } catch (e) {
        console.error("Logout error:", e);
    } finally {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
        window.location.href = "index.html";
    }
});

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

    detailStatus.className = "dashboard-status";

    if (statusClass === "pending") {
        detailStatus.classList.add("pending");
    }
    if (statusClass === "approved") {
        detailStatus.classList.add("approved");
    }
    if (statusClass === "rejected") {
        detailStatus.classList.add("rejected");
    }
    if (statusClass === "cancelled") {
        detailStatus.classList.add("cancelled");
    }

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
        const response = await fetch(`${API_BASE}/api/reservations/${reservationId}/cancel`, {
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
            const statusElement = row.querySelector(".dashboard-status");
            if (statusElement) {
                statusElement.textContent = "Dibatalkan";
                statusElement.className = "dashboard-status cancelled";
            }
        }

        detailStatus.textContent = "Dibatalkan";
        detailStatus.className = "dashboard-status cancelled";

        reservationCancelButton.style.display = "none";
        alert("Reservasi berhasil dibatalkan.");
        loadDashboardData();
    } catch (err) {
        console.error("Cancel reservation error:", err);
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

reservationCancelButton.addEventListener("click", cancelReservation);
reservationDetailClose.addEventListener("click", closeReservationDetail);
reservationDetailCancel.addEventListener("click", closeReservationDetail);

reservationDetailOverlay.addEventListener("click", function (event) {
    if (event.target === reservationDetailOverlay) {
        closeReservationDetail();
    }
});

// Damage Reports in Dashboard
const reportDetailOverlay = document.querySelector("#report-detail-overlay");
const reportDetailClose = document.querySelector("#report-detail-close");
const reportDetailCancel = document.querySelector("#report-detail-cancel");

const reportDetailFacility = document.querySelector("#report-detail-facility");
const reportDetailFacilityName = document.querySelector("#report-detail-facility-name");
const reportDetailCategory = document.querySelector("#report-detail-category");
const reportDetailLocation = document.querySelector("#report-detail-location");
const reportDetailDate = document.querySelector("#report-detail-date");
const reportDetailStatus = document.querySelector("#report-detail-status");
const reportDetailDescription = document.querySelector("#report-detail-description");
const reportDetailPhoto = document.querySelector("#report-detail-photo");
const reportDetailNote = document.querySelector("#report-detail-note");

const reportTableBody = document.querySelector("#report-table-body");
const reportTotal = document.querySelector("#report-total");
const reportNew = document.querySelector("#report-new");
const reportProcessing = document.querySelector("#report-processing");
const reportCompleted = document.querySelector("#report-completed");
const reportRejected = document.querySelector("#report-rejected");

function openReportDetail(button) {
    const facility = button.dataset.facility;
    const category = button.dataset.category;
    const location = button.dataset.location;
    const date = button.dataset.date;
    const status = button.dataset.status;
    const statusClass = button.dataset.statusClass;
    const description = button.dataset.description;
    const photo = button.dataset.photo;
    const note = button.dataset.note;

    reportDetailFacility.textContent = facility;
    reportDetailFacilityName.textContent = facility;
    reportDetailCategory.textContent = category;
    reportDetailLocation.textContent = location;
    reportDetailDate.textContent = date;
    reportDetailStatus.textContent = status;
    reportDetailDescription.textContent = description;
    reportDetailPhoto.textContent = photo;
    reportDetailNote.textContent = note;

    reportDetailStatus.className = "report-status " + statusClass;

    reportDetailOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
}

function closeReportDetail() {
    reportDetailOverlay.classList.remove("active");
    document.body.style.overflow = "";
}

document.addEventListener("click", function (event) {
    const button = event.target.closest(".report-detail-button");
    if (!button) {
        return;
    }
    openReportDetail(button);
});

reportDetailClose.addEventListener("click", closeReportDetail);
reportDetailCancel.addEventListener("click", closeReportDetail);

reportDetailOverlay.addEventListener("click", function (event) {
    if (event.target === reportDetailOverlay) {
        closeReportDetail();
    }
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeReservationDetail();
        closeReportDetail();
    }
});

// Load real data from Backend
async function loadDashboardData() {
    try {
        // 1. Fetch User Reservations (US 5)
        const resResponse = await fetch(`${API_BASE}/api/user/reservations`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json"
            }
        });

        if (resResponse.ok) {
            const resData = await resResponse.json();
            const reservations = resData.data || [];

            if (reservationTableBody) {
                reservationTableBody.innerHTML = "";
                reservations.slice(0, 5).forEach(res => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td><strong>${res.facility}</strong></td>
                        <td>${res.date}</td>
                        <td>${res.time}</td>
                        <td>${res.purpose}</td>
                        <td>
                            <span class="dashboard-status ${res.status_class}">${res.status}</span>
                        </td>
                        <td>
                            <button
                                type="button"
                                class="dashboard-table-action reservation-detail-button"
                                data-id="${res.id}"
                                data-facility="${res.facility}"
                                data-date="${res.date}"
                                data-time="${res.time}"
                                data-purpose="${res.purpose}"
                                data-status="${res.status}"
                                data-status-class="${res.status_class}"
                                data-file="${res.file}"
                                data-submitted="${res.submitted}"
                                data-cancellation-deadline="${res.cancellation_deadline || ''}"
                            >
                                Lihat
                            </button>
                        </td>
                    `;
                    reservationTableBody.appendChild(row);
                });

                // Attach click handlers to reservation detail buttons
                reservationTableBody.querySelectorAll(".reservation-detail-button").forEach(btn => {
                    btn.addEventListener("click", () => openReservationDetail(btn));
                });
            }

            // Update top stats cards
            const totalResCount = reservations.length;
            const pendingCount = reservations.filter(r => r.status_class === "pending").length;
            const approvedCount = reservations.filter(r => r.status_class === "approved").length;

            const statCards = document.querySelectorAll(".dashboard-stat-card");
            if (statCards.length >= 3) {
                statCards[0].querySelector("strong").textContent = totalResCount;
                statCards[1].querySelector("strong").textContent = pendingCount;
                statCards[2].querySelector("strong").textContent = approvedCount;
            }
        }

        // 2. Fetch User Damage Reports (US 7)
        const repResponse = await fetch(`${API_BASE}/api/user/reports`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json"
            }
        });

        if (repResponse.ok) {
            const repData = await repResponse.json();
            const reports = repData.data || [];

            if (reportTableBody) {
                reportTableBody.innerHTML = "";
                reports.forEach(report => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${report.facility}</td>
                        <td>${report.category}</td>
                        <td>${report.date}</td>
                        <td>
                            <span class="report-status ${report.statusClass}">
                                ${report.status}
                            </span>
                        </td>
                        <td>
                            <button
                                type="button"
                                class="report-detail-button"
                                data-facility="${report.facility}"
                                data-category="${report.category}"
                                data-location="${report.location}"
                                data-date="${report.date}"
                                data-status="${report.status}"
                                data-status-class="${report.statusClass}"
                                data-description="${report.description}"
                                data-photo="${report.photo}"
                                data-note="${report.note}"
                            >
                                Lihat
                            </button>
                        </td>
                    `;
                    reportTableBody.appendChild(row);
                });
            }

            // Update report count in stat card #4
            const statCards = document.querySelectorAll(".dashboard-stat-card");
            if (statCards.length >= 4) {
                const activeReports = reports.filter(r => r.statusClass === "new" || r.statusClass === "processing").length;
                statCards[3].querySelector("strong").textContent = activeReports;
            }

            // Update report stats overview
            if (reportTotal) reportTotal.textContent = reports.length;
            if (reportNew) reportNew.textContent = reports.filter(r => r.statusClass === "new").length;
            if (reportProcessing) reportProcessing.textContent = reports.filter(r => r.statusClass === "processing").length;
            if (reportCompleted) reportCompleted.textContent = reports.filter(r => r.statusClass === "completed").length;
            if (reportRejected) reportRejected.textContent = reports.filter(r => r.statusClass === "rejected").length;
        }
    } catch (err) {
        console.error("Dashboard data load error:", err);
    }
}

loadDashboardData();