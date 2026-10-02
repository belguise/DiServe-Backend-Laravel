const availabilityOverlay = document.querySelector("#availability-overlay");
const availabilityClose = document.querySelector("#availability-close");
const availabilityCancel = document.querySelector("#availability-cancel");
const availabilityDate = document.querySelector("#availability-date");
const availabilityFacilityName = document.querySelector(
  "#availability-facility-name",
);
const timeListContainer = document.querySelector(".availability-time-list");
let currentFacilityForAvailability = "";

function localDateString(date = new Date()) {
  const y=date.getFullYear(), m=String(date.getMonth()+1).padStart(2,'0'), d=String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}
const today = localDateString();
if (availabilityDate) { availabilityDate.min=today; if (!availabilityDate.value) availabilityDate.value=today; }

async function fetchAvailability(facilityName, date) {
  if (date && date < today) { date=today; if (availabilityDate) availabilityDate.value=today; }
  if (!timeListContainer) return;
  const API_BASE = (window.location.protocol === "file:" || (window.location.port && window.location.port !== "8000")) ? "http://127.0.0.1:8000" : "";
  try {
    const url = `${API_BASE}/api/facilities/${encodeURIComponent(facilityName)}/availability` + (date ? `?date=${date}` : "");
    const res = await fetch(url);
    if (!res.ok) return;
    const data = await res.json();
    if (data.slots && data.slots.length > 0) {
      timeListContainer.innerHTML = "";
      data.slots.forEach(slot => {
        const item = document.createElement("div");
        item.className = "availability-time-item";
        item.innerHTML = `
          <span class="availability-time">${slot.time}</span>
          <span class="availability-status ${slot.status}">${slot.status_label}</span>
        `;
        timeListContainer.appendChild(item);
      });
    }
  } catch (e) {
    console.error("Availability fetch error:", e);
  }
}

function openAvailability(facilityName) {
  currentFacilityForAvailability = facilityName;
  if (availabilityFacilityName) {
    availabilityFacilityName.textContent = facilityName;
  }

  const selectedDate = availabilityDate ? availabilityDate.value : "";
  fetchAvailability(facilityName, selectedDate);

  availabilityOverlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeAvailability() {
  availabilityOverlay.classList.remove("active");
  document.body.style.overflow = "";
}

availabilityClose.addEventListener("click", closeAvailability);
availabilityCancel.addEventListener("click", closeAvailability);

availabilityOverlay.addEventListener("click", function (event) {
  if (event.target === availabilityOverlay) {
    closeAvailability();
  }
});

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeAvailability();
  }
});

if (availabilityDate) {
  availabilityDate.addEventListener("change", function () {
    if (currentFacilityForAvailability) {
      fetchAvailability(currentFacilityForAvailability, availabilityDate.value);
    }
  });
}