const searchForm = document.querySelector("#facility-filter");
const searchInput = document.querySelector("#facility-search");
const typeFilter = document.querySelector("#facility-type");
const locationFilter = document.querySelector("#facility-location");
const capacityFilter = document.querySelector("#facility-capacity");
const grid = document.querySelector(".facility-grid");

function filterFacilities() {
  const facilityCards = document.querySelectorAll(".facility-card");
  const searchKeyword = searchInput ? searchInput.value.trim().toLowerCase() : "";
  const selectedType = typeFilter ? typeFilter.value.toLowerCase() : "";
  const selectedLocation = locationFilter ? locationFilter.value.toLowerCase() : "";
  const selectedCapacity = capacityFilter ? capacityFilter.value : "";

  facilityCards.forEach((card) => {
    const name = (card.dataset.name || "").toLowerCase();
    const type = (card.dataset.type || "").toLowerCase();
    const location = (card.dataset.location || "").toLowerCase();
    const capacity = Number(card.dataset.capacity || 0);

    const address = (
      card.querySelector(".facility-card-address")?.textContent || ""
    ).toLowerCase();

    const searchableText = `
            ${name}
            ${type}
            ${location}
            ${capacity}
            ${address}
        `.toLowerCase();

    const matchesSearch =
      searchKeyword === "" || searchableText.includes(searchKeyword);

    const matchesType = selectedType === "" || type === selectedType;

    const matchesLocation =
      selectedLocation === "" || location === selectedLocation;

    let matchesCapacity = true;

    if (selectedCapacity === "0-50") {
      matchesCapacity = capacity <= 50;
    }

    if (selectedCapacity === "51-100") {
      matchesCapacity = capacity >= 51 && capacity <= 100;
    }

    if (selectedCapacity === "101-300") {
      matchesCapacity = capacity >= 101 && capacity <= 300;
    }

    if (selectedCapacity === "301-800") {
      matchesCapacity = capacity >= 301 && capacity <= 800;
    }

    if (selectedCapacity === "801-2000") {
      matchesCapacity = capacity >= 801 && capacity <= 2000;
    }

    if (selectedCapacity === "2001+") {
      matchesCapacity = capacity >= 2001;
    }

    const shouldShow =
      matchesSearch && matchesType && matchesLocation && matchesCapacity;

    card.style.display = shouldShow ? "" : "none";
  });
}

async function loadFacilitiesFromApi() {
  if (!grid) return;
  const API_BASE = (window.location.protocol === "file:" || (window.location.port && window.location.port !== "8000")) ? "http://127.0.0.1:8000" : "";
  try {
    const res = await fetch(`${API_BASE}/api/facilities`);
    if (!res.ok) return;
    const json = await res.json();
    const facilities = json.data;
    if (facilities && facilities.length > 0) {
      grid.innerHTML = "";
      facilities.forEach((fac) => {
        const card = document.createElement("article");
        card.className = "facility-card";
        card.dataset.name = fac.name;
        card.dataset.type = fac.type;
        card.dataset.location = fac.location;
        card.dataset.capacity = fac.capacity;

        const stLower = (fac.status || "").toLowerCase();
        const isMaint = stLower === "maintenance" || stLower === "dalam perbaikan";
        const isInactive = stLower === "inactive" || stLower === "nonaktif";
        let statusBadgeClass = "available";
        let statusBadgeText = "Tersedia";

        if (isMaint) {
          statusBadgeClass = "unavailable";
          statusBadgeText = "Dalam Perbaikan";
        } else if (isInactive) {
          statusBadgeClass = "unavailable";
          statusBadgeText = "Nonaktif";
        }

        const imgSrc = fac.image_name
          ? `assets/images/${fac.image_name}`
          : "assets/images/muladi-dome.png";

        card.innerHTML = `
          <img src="${imgSrc}" alt="${fac.name}" class="facility-card-image" onerror="this.src='assets/images/muladi-dome.png'" />
          <div class="facility-card-overlay"></div>
          <div class="facility-card-top">
            <span class="facility-card-type">${fac.type}</span>
            <span class="facility-card-availability ${statusBadgeClass}">
              ${statusBadgeText}
            </span>
          </div>
          <div class="facility-card-content">
            <h3 class="facility-card-title">${fac.name}</h3>
            <div class="facility-card-meta">
              <span>
                <span class="material-symbols-outlined">location_on</span>
                ${fac.location}
              </span>
              <span>
                <span class="material-symbols-outlined">groups</span>
                ${fac.capacity} orang
              </span>
            </div>
            <p class="facility-card-address">
              <span class="material-symbols-outlined">signpost</span>
              ${fac.address || ""}
            </p>
            <button
              type="button"
              class="facility-card-button"
              onclick="openAvailability('${fac.name.replace(/'/g, "\\'")}')"
            >
              Lihat ketersediaan
              <span class="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        `;
        grid.appendChild(card);
      });
      filterFacilities();
    }
  } catch (e) {
    console.error("Error loading facilities:", e);
  }
}

if (searchForm) {
  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    filterFacilities();
  });
}

if (searchInput) {
  searchInput.addEventListener("input", () => {
    filterFacilities();
  });
}

if (typeFilter) {
  typeFilter.addEventListener("change", () => {
    filterFacilities();
  });
}

if (locationFilter) {
  locationFilter.addEventListener("change", () => {
    filterFacilities();
  });
}

if (capacityFilter) {
  capacityFilter.addEventListener("change", () => {
    filterFacilities();
  });
}

loadFacilitiesFromApi();