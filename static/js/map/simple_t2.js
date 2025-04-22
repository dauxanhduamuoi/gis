//Tìm marker gần nhất, xoá tuyến đường, chọn phương tiện
let userLocation = null;
let allCafes = [];
let currentRoute = null;
let currentDestination = null;
let cafeMarkers = []; // Danh sách marker
let currentOpenMarker = null;

// Khởi tạo bản đồ
const map = L.map('map').setView([10.762622, 106.660172], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© OpenStreetMap'
}).addTo(map);

// Icon
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
    fetchAndShowCafes();
    createControlBox();
}, () => {
    alert("Không thể lấy vị trí của bạn!");
});

// Hàm tính toán
function calculateDistance(from, to) {
    const R = 6371e3;
    const φ1 = from[0] * Math.PI / 180;
    const φ2 = to[0] * Math.PI / 180;
    const Δφ = (to[0] - from[0]) * Math.PI / 180;
    const Δλ = (to[1] - from[1]) * Math.PI / 180;
    const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}
function estimateTravelTime(distance, mode) {
    const speeds = { walking: 5, driving: 40, bicycling: 15 };
    return Math.round((distance / 1000) / (speeds[mode] || 5) * 60);
}
function getCurrentMode() {
    return document.getElementById('modeSelect')?.value || 'walking';
}

// Chỉ đường
function showRoute(destination) {
    if (currentRoute) map.removeControl(currentRoute);
    currentRoute = L.Routing.control({
        waypoints: [L.latLng(userLocation), L.latLng(destination)],
        routeWhileDragging: false,
        createMarker: () => null,
    }).addTo(map);
    currentDestination = destination;
}
function clearRoute() {
    if (currentRoute) {
        map.removeControl(currentRoute);
        currentRoute = null;
        currentDestination = null;
    }
}

// Hàm tạo nội dung popup
function createPopupContent(cafe) {
    const { name, address, hours, image, latitude, longitude } = cafe;
    const distance = calculateDistance(userLocation, [latitude, longitude]);
    const time = estimateTravelTime(distance, getCurrentMode());

    const div = document.createElement('div');
    div.innerHTML = `
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

    div.appendChild(btn);
    return div;
}

// Fetch & hiển thị marker
function fetchAndShowCafes() {
    fetch('/maps/api/cafes/')
        .then(res => res.json())
        .then(data => {
            allCafes = data;
            const group = new L.FeatureGroup();

            cafeMarkers = [];

            data.forEach(cafe => {
                const marker = L.marker([cafe.latitude, cafe.longitude], { icon: cafeIcon });

                marker.on('click', () => {
                    currentOpenMarker = marker;
                    const content = createPopupContent(cafe);
                    marker.bindPopup(content, { autoClose: false, closeOnClick: false }).openPopup();
                });

                cafeMarkers.push({ marker, cafe });
                group.addLayer(marker);
            });

            map.addLayer(group);
        });
}

// Cập nhật nội dung popup khi đổi phương tiện
function updateRouteWithNewMode() {
    if (currentDestination) {
        clearRoute();
        showRoute(currentDestination);
    }

    // Cập nhật nội dung popup nếu đang mở
    if (currentOpenMarker) {
        const cafeObj = cafeMarkers.find(obj => obj.marker === currentOpenMarker);
        if (cafeObj) {
            const updatedContent = createPopupContent(cafeObj.cafe);
            currentOpenMarker.setPopupContent(updatedContent).openPopup();
        }
    }
}

// Giao diện UI
function createControlBox() {
    const controlDiv = L.control({ position: 'topright' });
    controlDiv.onAdd = () => {
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

    setTimeout(() => {
        document.getElementById('modeSelect').addEventListener('change', updateRouteWithNewMode);
        document.getElementById('clearRouteBtn').addEventListener('click', clearRoute);
        document.getElementById('nearestBtn').addEventListener('click', () => {
            if (!userLocation || allCafes.length === 0) return;
            let minDist = Infinity, nearest = null;
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
                const markerObj = cafeMarkers.find(obj => obj.cafe === nearest);
                if (markerObj) {
                    currentOpenMarker = markerObj.marker;
                    markerObj.marker.bindPopup(createPopupContent(nearest), { autoClose: false, closeOnClick: false }).openPopup();
                }
            }
        });
    }, 300);
}
