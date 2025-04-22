let userLocation = null;
let allCafes = [];
let currentRoute = null;
let currentDestination = null;
let cafeMarkers = [];
let currentOpenMarker = null;
let clearRouteBtn = null;



// Cấu hình bản đồ
let config = {
    minZoom: 7,
    maxZoom: 18,
    fullscreenControl: true, // Thêm button fullscreen trên bản đồ
    zoom: 12,
    disableDefaultUI: false,
    
};

const map = L.map('map', config).setView([10.762622, 106.660172], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© OpenStreetMap'
}).addTo(map);

const userIcon = L.icon({
    iconUrl: '/static/images/user.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
});
const cafeIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.freepik.com/512/924/924514.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
});

navigator.geolocation.getCurrentPosition(position => {
    userLocation = [position.coords.latitude, position.coords.longitude];
    L.marker(userLocation).addTo(map).bindPopup('📍 Bạn đang ở đây').openPopup();
    map.setView(userLocation, 15);
    fetchAndShowCafes();
    createControlBox();
}, () => {
    alert("Không thể lấy vị trí của bạn!");
});

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
    const speeds = {
        walking: 5,
        driving: 40,
        bicycling: 15,
        motorcycle: 30,
        bus: 25
    };
    return Math.round((distance / 1000) / (speeds[mode] || 5) * 60);
}
function getCurrentMode() {
    return document.getElementById('modeSelect')?.value || 'walking';
}
function getRouteColor(mode) {
    const colors = {
        walking: 'green',
        driving: 'blue',
        bicycling: 'orange',
        motorcycle: 'purple',
        bus: 'red'
    };
    return colors[mode] || 'black';
}

function showRoute(destination) {
    if (currentRoute) map.removeControl(currentRoute);

    const color = getRouteColor(getCurrentMode());
    currentRoute = L.Routing.control({
        waypoints: [L.latLng(userLocation), L.latLng(destination)],
        routeWhileDragging: false,
        createMarker: () => null,
        lineOptions: {
            styles: [{ color: color, opacity: 0.8, weight: 6 }]
        }
    }).addTo(map);
    currentDestination = destination;

    if (clearRouteBtn) clearRouteBtn.style.display = 'inline-block'; // Hiện nút khi có tuyến đường
}

function clearRoute() {
    if (currentRoute) {
        map.removeControl(currentRoute);
        currentRoute = null;
        currentDestination = null;
    }
    if (clearRouteBtn) clearRouteBtn.style.display = 'none'; // Ẩn nút
}

function createPopupContent(cafe) {
    const { name, address, hours, image, latitude, longitude,  average_rating } = cafe;
    const distance = calculateDistance(userLocation, [latitude, longitude]);
    const time = estimateTravelTime(distance, getCurrentMode());
    const detailUrl = `/maps/cafes/${cafe.slug}/`;  // Tạo URL chi tiết trong JS

    const div = document.createElement('div');
    div.innerHTML = `
        <div style="font-family: Arial; max-width: 250px;">
            <h5 style="margin: 0; font-size: 16px; color: #d13f19;">${name}</h5>
            <img src="/static/images/${image}" alt="${name}" style="width: 100%; max-height: 140px; object-fit: cover; margin-bottom: 5px; border-radius: 5px;">
            <p><strong>⭐ Đánh giá:</strong> ${average_rating ? `${average_rating.toFixed(1)} / 5` : 'Chưa có đánh giá'}</p>
            <p><strong>📍 Địa chỉ:</strong> ${address}</p>
            <p><strong>🕒 Giờ mở cửa:</strong> ${hours}</p>
            <p><strong>📏 Khoảng cách:</strong> ${(distance/1000).toFixed(2)} km</p>
            <p><strong>⏱ Thời gian dự kiến:</strong> ${time} phút</p>
            <a href="https://www.google.com/maps/search/?q=${latitude},${longitude}" target="_blank">🔗 Xem Google Maps</a>
            <a href="${detailUrl}" class="btn btn-sm btn-outline-primary mt-2">🔎 Xem chi tiết</a>
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

function fetchAndShowCafes() {
    fetch('/maps/api/cafes/')
        .then(res => res.json())
        .then(data => {
            allCafes = data;
            const group = new L.FeatureGroup();
            cafeMarkers = [];

            data.forEach(cafe => {
                const marker = L.marker([cafe.latitude, cafe.longitude], { icon: cafeIcon });

                const content = createPopupContent(cafe);
                marker.bindPopup(content, { autoClose: false, closeOnClick: false });

                marker.on('click', () => {
                    currentOpenMarker = marker;
                    marker.openPopup();
                });

                cafeMarkers.push({ marker, cafe });
                group.addLayer(marker);
            });

            map.addLayer(group);
        });
}

function updateRouteWithNewMode() {
    if (currentRoute && currentDestination) {
        // Lấy tuyến đường mới nhưng giữ lại điểm đến cũ
        const mode = getCurrentMode();
        const color = getRouteColor(mode);

        const newRoute = L.Routing.control({
            waypoints: [L.latLng(userLocation), L.latLng(currentDestination)],
            routeWhileDragging: false,
            createMarker: () => null,
            lineOptions: {
                styles: [{ color: color, opacity: 0.8, weight: 6 }]
            }
        });

        // Gỡ tuyến cũ rồi thay bằng tuyến mới
        map.removeControl(currentRoute);
        currentRoute = newRoute.addTo(map);
    }

    // Cập nhật lại nội dung popup nếu đang mở
    if (currentOpenMarker) {
        const cafeObj = cafeMarkers.find(obj => obj.marker === currentOpenMarker);
        if (cafeObj) {
            const updatedContent = createPopupContent(cafeObj.cafe);
            currentOpenMarker.setPopupContent(updatedContent).openPopup();
        }
    }
}

function createControlBox() {
    const controlDiv = L.control({ position: 'topright' });
    controlDiv.onAdd = () => {
        const div = L.DomUtil.create('div', 'control-box');
        div.innerHTML = `
            <div style="background: white; padding: 10px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.2); font-family: Arial;">
            <input type="text" id="searchInput" class="form-control form-control-sm mb-2" placeholder="🔍 Tìm quán theo tên hoặc địa chỉ">
            <button id="resetSearchBtn" class="btn btn-sm btn-outline-secondary mb-2">🔄 Reset tìm kiếm</button>
            <div></div>
                <label><strong>Phương tiện:</strong></label><br>
                <select id="modeSelect" class="form-select form-select-sm mt-1 mb-2">
                    <option value="walking">🚶 Đi bộ</option>
                    <option value="driving">🚗 Lái xe</option>
                    <option value="bicycling">🚴 Xe đạp</option>
                    <option value="motorcycle">🏍️ Xe mô tô</option>
                    <option value="bus">🚌 Xe buýt</option>
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

        clearRouteBtn = document.getElementById('clearRouteBtn');
        clearRouteBtn.style.display = 'none'; // Ẩn ban đầu

        document.getElementById('searchInput').addEventListener('input', (e) => {
            const keyword = e.target.value.toLowerCase().trim();
        
            cafeMarkers.forEach(({ marker, cafe }) => {
                const match = cafe.name.toLowerCase().includes(keyword) || cafe.address.toLowerCase().includes(keyword);
        
                if (keyword === "") {
                    marker.setOpacity(1); // reset
                    marker.setZIndexOffset(0);
                } else if (match) {
                    marker.setOpacity(1);
                    marker.setZIndexOffset(1000);
                } else {
                    marker.setOpacity(0.2); // mờ đi
                    marker.setZIndexOffset(0);
                }
            });
        });
        document.getElementById('resetSearchBtn').addEventListener('click', () => {
            document.getElementById('searchInput').value = '';
            
            cafeMarkers.forEach(({ marker }) => {
                marker.setOpacity(1);
                marker.setZIndexOffset(0);
            });
        });
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
                    const content = createPopupContent(nearest);
                    currentOpenMarker.setPopupContent(content).openPopup();
                }
            }
        });
    }, 300);
}
