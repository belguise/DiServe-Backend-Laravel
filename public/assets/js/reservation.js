const token = localStorage.getItem("auth_token");

if (!token) {
    window.location.href = "login.html";
}

const reservationForm = document.querySelector("#reservation-form");

const facilityInput = document.querySelector("#facility");
const startDateInput = document.querySelector("#start-date");
const endDateInput = document.querySelector("#end-date");
const startTimeInput = document.querySelector("#start-time");
const endTimeInput = document.querySelector("#end-time");
const purposeInput = document.querySelector("#purpose");
const supportingFileInput = document.querySelector("#supporting-file");
const fileError = document.querySelector("#file-error");

const successOverlay = document.querySelector("#reservation-success-overlay");
const successClose = document.querySelector("#reservation-success-close");
const successCloseButton = document.querySelector("#reservation-success-close-button");

const successFacility = document.querySelector("#success-reservation-facility");
const successDate = document.querySelector("#success-reservation-date");
const successTime = document.querySelector("#success-reservation-time");
const successPurpose = document.querySelector("#success-reservation-purpose");
const successFile = document.querySelector("#success-reservation-file");

const today = new Date().toISOString().split("T")[0];

if (startDateInput && endDateInput) {
    startDateInput.min = today;
    endDateInput.min = today;

    startDateInput.addEventListener("change", function () {
        endDateInput.min = startDateInput.value;

        if (endDateInput.value && endDateInput.value < startDateInput.value) {
            endDateInput.value = startDateInput.value;
        }
    });
}

function formatDate(date) {
    return new Date(date + "T00:00:00").toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

function showSuccessOverlay(reservation) {
    successFacility.textContent = reservation.facility;
    successDate.textContent = reservation.date;
    successTime.textContent = reservation.time;
    successPurpose.textContent = reservation.purpose;
    successFile.textContent = reservation.file;

    successOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
}

function closeSuccessOverlay() {
    successOverlay.classList.remove("active");
    document.body.style.overflow = "";
    window.location.href = "reservations.html";
}

reservationForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    
    const facilitySelect = facilityInput;
    const selectedOption = facilitySelect.options[facilitySelect.selectedIndex];
    const facilityName = selectedOption.text;
    const facilityValue = facilitySelect.value;

    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    const startTime = startTimeInput.value;
    const endTime = endTimeInput.value;
    const purpose = purposeInput.value.trim();
    const supportingFile = supportingFileInput ? supportingFileInput.files[0] : null;

    if (endDate < startDate) {
        alert("Tanggal selesai tidak boleh lebih awal dari tanggal mulai.");
        return;
    }
    if (startDate === endDate && endTime <= startTime) {
        alert("Jam selesai harus lebih dari jam mulai.");
        return;
    }
    if (purpose.length < 5) {
        alert("Keperluan harus diisi dengan jelas.");
        return;
    }

    const submitBtn = reservationForm.querySelector("button[type='submit']");
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Mengirim...";
    }

    try {
        const formData = new FormData();
        formData.append("facility", facilityValue);
        formData.append("start_date", startDate);
        formData.append("end_date", endDate);
        formData.append("start_time", startTime);
        formData.append("end_time", endTime);
        formData.append("purpose", purpose);
        if (supportingFile) {
            formData.append("supporting_file", supportingFile);
        }

        const response = await fetch("/api/reservations", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json"
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Gagal membuat reservasi.");
            return;
        }

        const reservation = {
            id: data.reservation.id,
            facility: facilityName,
            startDate: startDate,
            endDate: endDate,
            date: startDate === endDate ? formatDate(startDate) : formatDate(startDate) + " - " + formatDate(endDate),
            time: startTime + " - " + endTime,
            purpose: purpose,
            file: supportingFile ? supportingFile.name : "Tidak ada berkas",
            status: "Menunggu",
            statusClass: "pending",
        };

        showSuccessOverlay(reservation);
    } catch (err) {
        console.error("Reservation submit error:", err);
        alert("Tidak dapat terhubung ke server. Silakan coba lagi.");
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Ajukan Reservasi";
        }
    }
});

successClose.addEventListener("click", closeSuccessOverlay);
successCloseButton.addEventListener("click", closeSuccessOverlay);
successOverlay.addEventListener("click", function (event) {
    if (event.target === successOverlay) {
        closeSuccessOverlay();
    }
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeSuccessOverlay();
    }
});