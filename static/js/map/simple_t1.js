let userLocation = null;
let allCafes = [];
let currentRoute = null;
let currentDestination = null;

// Khởi tạo bản đồ
const map = L.map('map').setView([10.762622, 106.660172], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© OpenStreetMap'
}).addTo(map);

// Icon người dùng và cafe
const userIcon = L.icon({
    iconUrl: '/static/images/user.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
});
const cafeIcon = L.icon({
    iconUrl: '/static/images/cafe-marker.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
});

// Lấy vị trí người dùng
navigator.geolocation.getCurrentPosition(position => {
    userLocation = [position.coords.latitude, position.coords.longitude];
    L.marker(userLocation, { icon: userIcon }).addTo(map).bindPopup('📍 Bạn đang ở đây').openPopup();
    map.setView(userLocation, 15);
    fetchAndShowCafes(); // chỉ gọi khi đã có user location
    createControlBox();  // tạo UI sau khi có bản đồ
}, err => {
    alert("Không thể lấy vị trí của bạn!");
});

// Tính khoảng cách và thời gian
function calculateDistance(from, to) {
    const R = 6371e3; // Earth radius
    const φ1 = from[0] * Math.PI / 180;
    const φ2 = to[0] * Math.PI / 180;
    const Δφ = (to[0] - from[0]) * Math.PI / 180;
    const Δλ = (to[1] - from[1]) * Math.PI / 180;

    const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function estimateTravelTime(distance, mode) {
    const speeds = {
        walking: 5,
        driving: 40,
        bicycling: 15
    };
    const speed = speeds[mode] || 5;
    return Math.round((distance / 1000) / speed * 60);
}

function getCurrentMode() {
    return document.getElementById('modeSelect')?.value || 'walking';
}

// Hiển thị chỉ đường
function showRoute(destination) {
    if (currentRoute) map.removeControl(currentRoute);

    currentRoute = L.Routing.control({
        waypoints: [L.latLng(userLocation), L.latLng(destination)],
        routeWhileDragging: false,
        createMarker: () => null,
    }).addTo(map);

    currentDestination = destination;
}

// Xoá tuyến đường
function clearRoute() {
    if (currentRoute) {
        map.removeControl(currentRoute);
        currentRoute = null;
        currentDestination = null;
    }
}

// Cập nhật lại tuyến đường với phương tiện mới
function updateRouteWithNewMode() {
    if (currentDestination) {
        clearRoute();
        showRoute(currentDestination);

        // Hiển thị lại popup nếu cần
        setTimeout(() => {
            const popup = document.querySelector('.leaflet-popup-content');
            if (popup) {
                popup.scrollIntoView({ behavior: 'smooth' });
            }
        }, 300);
    }
}

// Fetch và hiển thị các marker
function fetchAndShowCafes() {
    fetch('/maps/api/cafes/')
        .then(response => response.json())
        .then(data => {
            allCafes = data;
            const group = new L.FeatureGroup();

            data.forEach(cafe => {
                const { latitude, longitude, name, address, hours, image } = cafe;
                const marker = L.marker([latitude, longitude], { icon: cafeIcon });

                marker.on('click', () => {
                    if (!userLocation) return;
                    currentDestination = [latitude, longitude]; // ← Ghi lại điểm đến

                    const mode = getCurrentMode();
                    const distance = calculateDistance(userLocation, [latitude, longitude]);
                    const time = estimateTravelTime(distance, mode);

                    const popupDiv = document.createElement('div');
                    popupDiv.innerHTML = `
                        <div style="font-family: Arial; max-width: 250px;">
                            <h5 style="margin: 0; font-size: 16px; color: #d13f19;">${name}</h5>
                            <img src="/static/images/${image}" alt="${name}" style="width: 100%; max-height: 140px; object-fit: cover; margin-bottom: 5px; border-radius: 5px;">
                            <p><strong>📍 Địa chỉ:</strong> ${address}</p>
                            <p><strong>🕒 Giờ mở cửa:</strong> ${hours}</p>
                            <p><strong>📏 Khoảng cách:</strong> ${(distance/1000).toFixed(2)} km</p>
                            <p><strong>⏱ Thời gian dự kiến:</strong> ${time} phút</p>
                            <a href="https://www.google.com/maps/search/?q=${latitude},${longitude}" target="_blank">🔗 Xem Google Maps</a>
                        </div>
                    `;

                    const btn = document.createElement('button');
                    btn.textContent = '📍 Chỉ đường';
                    btn.className = 'btn btn-sm btn-primary mt-2';
                    btn.style.marginTop = '8px';
                    btn.addEventListener('click', () => {
                        showRoute([latitude, longitude]);
                    });

                    popupDiv.appendChild(btn);

                    marker.bindPopup(popupDiv).openPopup();
                });

                group.addLayer(marker);
            });

            map.addLayer(group);
        })
        .catch(err => console.error("Lỗi khi fetch dữ liệu quán:", err));
}

// Tạo UI chọn phương tiện, tìm gần nhất, huỷ tuyến đường
function createControlBox() {
    const controlDiv = L.control({ position: 'topright' });

    controlDiv.onAdd = function () {
        const div = L.DomUtil.create('div', 'control-box');
        div.innerHTML = `
            <div style="background: white; padding: 10px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.2); font-family: Arial;">
                <label><strong>Phương tiện:</strong></label><br>
                <select id="modeSelect" class="form-select form-select-sm mt-1 mb-2">
                    <option value="walking">🚶 Đi bộ</option>
                    <option value="driving">🚗 Lái xe</option>
                    <option value="bicycling">🚴 Xe đạp</option>
                </select>
                <button id="nearestBtn" class="btn btn-sm btn-success mb-1">📍 Quán gần nhất</button><br>
                <button id="clearRouteBtn" class="btn btn-sm btn-secondary">❌ Huỷ tuyến đường</button>
            </div>
        `;
        return div;
    };

    controlDiv.addTo(map);

    // Gán sự kiện
    setTimeout(() => {
        document.getElementById('modeSelect').addEventListener('change', () => {
            updateRouteWithNewMode();
        });

        document.getElementById('nearestBtn').addEventListener('click', () => {
            if (!userLocation || allCafes.length === 0) return;

            let nearest = null;
            let minDist = Infinity;

            allCafes.forEach(cafe => {
                const dist = calculateDistance(userLocation, [cafe.latitude, cafe.longitude]);
                if (dist < minDist) {
                    minDist = dist;
                    nearest = cafe;
                }
            });

            if (nearest) {
                const latlng = [nearest.latitude, nearest.longitude];
                map.setView(latlng, 16);
                showRoute(latlng);
            }
        });

        document.getElementById('clearRouteBtn').addEventListener('click', () => {
            clearRoute();
        });
    }, 300);
}
