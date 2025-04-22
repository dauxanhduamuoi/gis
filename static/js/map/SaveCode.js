    navigator.geolocation.getCurrentPosition(function(position) {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        
        console.log("Vị trí người dùng: ", userLat, userLng);
    
        // Sau khi có tọa độ người dùng, bạn có thể thực hiện các thao tác tiếp theo
        // Ví dụ: Tìm marker gần nhất và vẽ lộ trình
    }, function(error) {
        console.error("Không thể lấy vị trí người dùng", error);
    });

    // Hàm tính khoảng cách giữa hai điểm (theo công thức Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Bán kính trái đất (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Đơn vị là km
    return distance;
}

// Giả sử pointsCafe là mảng các quán cà phê có dữ liệu (latitude, longitude, name, address)
const pointsCafe_1 = [
    [10.123456, 106.123456, "Cafe A", "123 Street, City", "9:00 AM - 10:00 PM"],
    [10.654321, 106.654321, "Cafe B", "456 Street, City", "8:00 AM - 8:00 PM"]
];

// Lấy vị trí người dùng
navigator.geolocation.getCurrentPosition(function(position) {
    const userLat = position.coords.latitude;
    const userLng = position.coords.longitude;
    
    // Tính khoảng cách giữa người dùng và từng quán cà phê
    let closestCafe = null;
    let minDistance = Infinity;

    pointsCafe_1.forEach(function(cafe) {
        const [lat, lng] = cafe;
        const distance = calculateDistance(userLat, userLng, lat, lng);
        
        if (distance < minDistance) {
            minDistance = distance;
            closestCafe = cafe;
        }
    });

    console.log("Quán cà phê gần nhất: ", closestCafe);
    // Sau khi có quán cà phê gần nhất, bạn có thể vẽ đường đi
});
//-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------
// Hàm hiển thị đường đi
fetch('/maps/api/cafes/')
    .then(response => response.json())
    .then(data => {
        const pA = new L.FeatureGroup();

        data.forEach(cafe => {
            const { latitude, longitude, name, address, hours } = cafe;

            const marker = L.marker([latitude, longitude], { icon: cafeIcon })
                .bindPopup(`
                    <b>${name}</b><br>
                    <strong>Địa chỉ:</strong> ${address}<br>
                    <strong>Giờ mở cửa:</strong> ${hours}<br>
                    <a href="https://www.google.com/maps/search/?q=${latitude},${longitude}" target="_blank">Xem trên bản đồ</a>
                     <button onclick="showRoute([${latitude}, ${longitude}])">Chỉ đường</button>
                `);

            pA.addLayer(marker);
        });

        map.addLayer(pA);
    })
    .catch(error => console.log('Error fetching cafes data:', error));
//-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------
window.addEventListener('load', () => {

    let userLocation = null;
    let routingControl = null;
    
    // Lấy vị trí hiện tại
    navigator.geolocation.getCurrentPosition(
        position => {
            userLocation = [position.coords.latitude, position.coords.longitude];
            L.marker(userLocation).addTo(map).bindPopup("Vị trí của bạn").openPopup();
        },
        error => {
            console.error("Không thể lấy vị trí người dùng:", error);
        }
    );
    
    // Hàm hiển thị đường đi
    function showRoute(destination) {
        if (!userLocation) {
            alert("Chưa lấy được vị trí của bạn!");
            return;
        }
    
        // Xóa route cũ nếu có
        if (routingControl) {
            map.removeControl(routingControl);
        }
    
        routingControl = L.Routing.control({
            waypoints: [
                L.latLng(userLocation[0], userLocation[1]),
                L.latLng(destination[0], destination[1])
            ],
            routeWhileDragging: false,
            show: false,
            addWaypoints: false,
            draggableWaypoints: false
        }).addTo(map);
    }
    
    
    
    // Hàm để lấy dữ liệu từ API và hiển thị các marker
    fetch('/maps/api/cafes/')
        .then(response => response.json())
        .then(data => {
            const pA = new L.FeatureGroup();
    
            data.forEach(cafe => {
                const { latitude, longitude, name, address, hours } = cafe;
    
                const marker = L.marker([latitude, longitude], { icon: cafeIcon })
                    .bindPopup(`
                        <b>${name}</b><br>
                        <strong>Địa chỉ:</strong> ${address}<br>
                        <strong>Giờ mở cửa:</strong> ${hours}<br>
                        <a href="https://www.google.com/maps/search/?q=${latitude},${longitude}" target="_blank">Xem trên bản đồ</a>
                         <button onclick="showRoute([${latitude}, ${longitude}])">Chỉ đường</button>
                    `);
    
                pA.addLayer(marker);
            });
    
            map.addLayer(pA);
        })
        .catch(error => console.log('Error fetching cafes data:', error));
    
    });
//-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------
window.addEventListener('load', () => {

    let userLocation = null;
    let routingControl = null;

    // Lấy vị trí hiện tại
    navigator.geolocation.getCurrentPosition(
        position => {
            userLocation = [position.coords.latitude, position.coords.longitude];
            // Cập nhật bản đồ và zoom vào vị trí người dùng
        map.setView(userLocation, 15); // zoom = 15 là khá gần, bạn có thể chỉnh 14, 16 tùy ý
            L.marker(userLocation).addTo(map).bindPopup("Vị trí của bạn").openPopup();
        },
        error => {
            console.error("Không thể lấy vị trí người dùng:", error);
        }
    );

    // Hàm hiển thị đường đi
    function showRoute(destination) {
        if (!userLocation) {
            alert("Chưa lấy được vị trí của bạn!");
            return;
        }
        const selectedMode = document.getElementById('travelMode')?.value || 'car';
        // Xóa route cũ nếu có
        if (routingControl) {
            map.removeControl(routingControl);
        }

        routingControl = L.Routing.control({
            waypoints: [
                L.latLng(userLocation[0], userLocation[1]),
                L.latLng(destination[0], destination[1])
            ],
            routeWhileDragging: false,
            show: false,
            addWaypoints: false,
            draggableWaypoints: false
        }).addTo(map);
    }

    // Hàm để lấy dữ liệu từ API và hiển thị các marker
    fetch('/maps/api/cafes/')
        .then(response => response.json())
        .then(data => {
            const pA = new L.FeatureGroup();

            data.forEach(cafe => {
                const { latitude, longitude, name, address, hours } = cafe;

                const marker = L.marker([latitude, longitude], { icon: cafeIcon });

                // Tạo phần tử DOM cho popup
                const popupDiv = document.createElement('div');

                // Tính khoảng cách nếu có userLocation
                let distanceText = '';
                let timeText = '';
                let distanceKm = null;
                if (typeof userLocation !== 'undefined' && userLocation) {
                    const userLatLng = L.latLng(userLocation);
                    const cafeLatLng = L.latLng(latitude, longitude);
                    const distance = userLatLng.distanceTo(cafeLatLng); // tính bằng mét
                    const rounded = (distance / 1000).toFixed(2); // đổi sang km, làm tròn 2 chữ số
                    const distanceKm = Number(rounded);
                    distanceText = `<strong>Khoảng cách:</strong> ${rounded} km<br>`;


                // Tính thời gian di chuyển đơn giản (tùy phương tiện)
                const mode = document.getElementById('travelMode')?.value || 'car';
                let speed; // km/h
                switch (mode) {
                    case 'foot':
                        speed = 5; break;
                    case 'bike':
                        speed = 40; break;
                    default:
                        speed = 60; break;
                }
                const travelTimeHours = distanceKm / speed;
                const travelTimeMinutes = Math.round(travelTimeHours * 60);
                timeText = `<strong>Thời gian di chuyển (~):</strong> ${travelTimeMinutes} phút<br>`;
                }    

                popupDiv.innerHTML = `
                    <b>${name}</b><br>
                    <strong>Địa chỉ:</strong> ${address}<br>
                    <strong>Giờ mở cửa:</strong> ${hours}<br>
                    ${distanceText}
                    ${timeText}
                    <a href="https://www.google.com/maps/search/?q=${latitude},${longitude}" target="_blank">Xem trên bản đồ</a><br>
                    <button onclick="showRoute([${latitude}, ${longitude}])">Chỉ đường</button>
                `;

                const button = document.createElement('button');
                button.textContent = 'Chỉ đường';
                button.className = 'btn btn-sm btn-primary mt-2';
                button.addEventListener('click', () => {
                    showRoute([latitude, longitude]);
                });

                popupDiv.appendChild(button);

                marker.bindPopup(popupDiv);
                pA.addLayer(marker);
            });

            map.addLayer(pA);
        })
        .catch(error => console.log('Error fetching cafes data:', error));


        document.getElementById('travelMode').addEventListener('change', () => {
            updateAllPopups();
        });
        
        // Hàm cập nhật lại nội dung popup với khoảng cách và thời gian
        function updateAllPopups() {
            if (!userLocation) return;
        
            map.eachLayer(layer => {
                if (layer instanceof L.Marker && layer.getPopup) {
                    const popup = layer.getPopup();
                    const latlng = layer.getLatLng();
        
                    const distance = L.latLng(userLocation).distanceTo(latlng);
                    const distanceKmStr = (distance / 1000).toFixed(2);
                    const distanceKm = Number(distanceKmStr);
        
                    const mode = document.getElementById('travelMode')?.value || 'car';
                    let speed = 60;
                    if (mode === 'foot') speed = 5;
                    else if (mode === 'bike') speed = 40;
        
                    const travelTimeMinutes = Math.round((distanceKm / speed) * 60);
        
                    const content = popup.getContent();
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(content, 'text/html');
        
                    // Thêm/ghi đè lại khoảng cách và thời gian nếu có
                    let extraInfo = doc.querySelector('.extra-info');
                    if (!extraInfo) {
                        extraInfo = document.createElement('div');
                        extraInfo.className = 'extra-info';
                        doc.body.appendChild(extraInfo);
                    }
                    extraInfo.innerHTML = `
                        <strong>Khoảng cách:</strong> ${distanceKmStr} km<br>
                        <strong>Thời gian ước tính:</strong> ${travelTimeMinutes} phút
                    `;
        
                    popup.setContent(doc.body.innerHTML);
                }
            });
        }

});
//-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------
//Hàm chạy ổn: Vẽ đường, khoảng cách, thời gian, phương tiện
window.addEventListener('load', () => {
    let userLocation = null;
    let routingControl = null;

    // Tốc độ trung bình theo phương tiện (km/h)
    const speedByMode = {
        foot: 5,
        bike: 40,
        car: 60
    };

    const getCurrentMode = () => document.getElementById('travelMode')?.value || 'car';

    // Lấy vị trí người dùng
    navigator.geolocation.getCurrentPosition(
        position => {
            userLocation = [position.coords.latitude, position.coords.longitude];

            L.marker(userLocation).addTo(map).bindPopup("📍 Vị trí của bạn").openPopup();
            L.circle(userLocation, {
                radius: 200,
                color: 'red',
                fillOpacity: 0.2
            }).addTo(map);
        },
        error => {
            console.error("Không thể lấy vị trí người dùng:", error);
        }
    );

    // Tính khoảng cách (mét)
    function calculateDistance(from, to) {
        return L.latLng(from).distanceTo(L.latLng(to));
    }

    // Tính thời gian (phút)
    function estimateTravelTime(distanceMeters, mode) {
        const speed = speedByMode[mode] || 60;
        const distanceKm = distanceMeters / 1000;
        return Math.round((distanceKm / speed) * 60);
    }

    // Hàm chỉ đường
    window.showRoute = function(destination) {
        if (!userLocation) {
            alert("Vui lòng bật định vị để sử dụng chức năng này.");
            return;
        }

        if (routingControl) {
            map.removeControl(routingControl);
        }

        routingControl = L.Routing.control({
            waypoints: [
                L.latLng(userLocation),
                L.latLng(destination)
            ],
            routeWhileDragging: false,
            show: false,
            addWaypoints: false,
            draggableWaypoints: false
        }).addTo(map);
    };

    // Load markers từ API
    fetch('/maps/api/cafes/')
        .then(response => response.json())
        .then(data => {
            const pA = new L.FeatureGroup();

            data.forEach(cafe => {
                const { latitude, longitude, name, address, hours } = cafe;
                const marker = L.marker([latitude, longitude], { icon: cafeIcon });

                marker.on('click', () => {
                    if (!userLocation) return;
                
                    const mode = getCurrentMode();
                    const distance = calculateDistance(userLocation, [latitude, longitude]);
                    const time = estimateTravelTime(distance, mode);
                
                    const popupDiv = document.createElement('div');
                    popupDiv.innerHTML = `
                        <b>${name}</b><br>
                        <strong>Địa chỉ:</strong> ${address}<br>
                        <strong>Giờ mở cửa:</strong> ${hours}<br>
                        <strong>Khoảng cách:</strong> ${(distance / 1000).toFixed(2)} km<br>
                        <strong>Thời gian dự kiến:</strong> ${time} phút<br>
                        <a href="https://www.google.com/maps/search/?q=${latitude},${longitude}" target="_blank">Xem trên bản đồ</a><br>
                    `;
                
                    const routeBtn = document.createElement('button');
                    routeBtn.textContent = '📍 Chỉ đường';
                    routeBtn.className = 'btn btn-sm btn-primary mt-2';
                    routeBtn.addEventListener('click', () => {
                        showRoute([latitude, longitude]);
                    });
                
                    popupDiv.appendChild(routeBtn);
                
                    // Quan trọng: Luôn re-bind popup và mở lại
                    marker.unbindPopup(); // xóa popup cũ
                    marker.bindPopup(popupDiv).openPopup();
                });

                pA.addLayer(marker);
            });

            map.addLayer(pA);
        })
        .catch(error => console.log('Error fetching cafes data:', error));
});
//-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------
//Hàm chạy ổn: Vẽ đường, khoảng cách, thời gian, phương tiện, tìm marker gần nhất
window.addEventListener('load', () => {
    let userLocation = null;
    let routingControl = null;

    // Dropdown phương tiện
    const travelModeSelect = document.createElement('select');
    travelModeSelect.id = 'travelMode';
    travelModeSelect.className = 'form-select mb-2';
    ['walking', 'bicycle', 'motorbike', 'car', 'bus'].forEach(mode => {
        const option = document.createElement('option');
        option.value = mode;
        option.textContent = {
            walking: '🚶 Đi bộ',
            bicycle: '🚴 Xe đạp',
            motorbike: '🏍️ Xe máy',
            car: '🚗 Ô tô',
            bus: '🚌 Xe buýt'
        }[mode];
        travelModeSelect.appendChild(option);
    });
    document.querySelector('.auto-search-wrapper')?.appendChild(travelModeSelect);

    // Lấy vị trí người dùng
    navigator.geolocation.getCurrentPosition(
        position => {
            userLocation = [position.coords.latitude, position.coords.longitude];
            L.marker(userLocation).addTo(map).bindPopup("📍 Vị trí của bạn").openPopup();

            // Vẽ vòng tròn (đã thu nhỏ)
            L.circle(userLocation, {
                radius: 200, // 200 mét
                color: 'red',
                fillColor: '#f03',
                fillOpacity: 0.2
            }).addTo(map);

            map.setView(userLocation, 15);
        },
        error => {
            console.error("Không thể lấy vị trí người dùng:", error);
        }
    );

    // Hàm lấy mode hiện tại
    function getCurrentMode() {
        return document.getElementById('travelMode').value;
    }

    // Tính khoảng cách theo Haversine (đơn vị mét)
    function calculateDistance(coord1, coord2) {
        const R = 6371e3;
        const toRad = deg => deg * Math.PI / 180;
        const [lat1, lon1] = coord1.map(toRad);
        const [lat2, lon2] = coord2.map(toRad);
        const dLat = lat2 - lat1;
        const dLon = lon2 - lon1;
        const a = Math.sin(dLat / 2) ** 2 +
                  Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    // Tính thời gian (phút) theo mode
    function estimateTravelTime(distance, mode) {
        const speed = {
            walking: 5,
            bicycle: 15,
            motorbike: 40,
            car: 50,
            bus: 30
        }[mode] || 5;
        return Math.round((distance / 1000) / speed * 60);
    }

    // Vẽ tuyến đường
    function showRoute(destination) {
        if (!userLocation) {
            alert("Không lấy được vị trí người dùng.");
            return;
        }

        if (routingControl) map.removeControl(routingControl);

        routingControl = L.Routing.control({
            waypoints: [
                L.latLng(userLocation),
                L.latLng(destination)
            ],
            routeWhileDragging: false,
            addWaypoints: false,
            draggableWaypoints: false,
            show: false,
            createMarker: function () {
                return null; // không tạo marker mặc định
            }
        }).addTo(map);
    }




  
    let cafeGroup = new L.FeatureGroup();
    // Fetch & hiển thị marker
    fetch('/maps/api/cafes/')
        .then(response => response.json())
        .then(data => {
            const pA = new L.FeatureGroup();

            data.forEach(cafe => {
                const { latitude, longitude, name, address, hours } = cafe;
                const marker = L.marker([latitude, longitude], { icon: cafeIcon });

                marker.on('popupopen', () => marker.isPopupOpen = () => true);
                marker.on('popupclose', () => marker.isPopupOpen = () => false);

                marker.on('click', () => {
                    if (!userLocation) return;

                    const mode = getCurrentMode();
                    const distance = calculateDistance(userLocation, [latitude, longitude]);
                    const time = estimateTravelTime(distance, mode);

                    const popupDiv = document.createElement('div');
                    popupDiv.innerHTML = `
                        <b>${name}</b><br>
                        <strong>Địa chỉ:</strong> ${address}<br>
                        <strong>Giờ mở cửa:</strong> ${hours}<br>
                        <strong>Khoảng cách:</strong> ${(distance / 1000).toFixed(2)} km<br>
                        <strong>Thời gian dự kiến:</strong> ${time} phút<br>
                        <a href="https://www.google.com/maps/search/?q=${latitude},${longitude}" target="_blank">Xem trên bản đồ</a><br>
                    `;

                    const btn = document.createElement('button');
                    btn.textContent = '📍 Chỉ đường';
                    btn.className = 'btn btn-sm btn-primary mt-2';
                    btn.addEventListener('click', () => {
                        showRoute([latitude, longitude]);
                    });

                    popupDiv.appendChild(btn);

                    marker.unbindPopup();
                    marker.bindPopup(popupDiv).openPopup();
                });

                pA.addLayer(marker);
            });

            map.addLayer(pA);
        })
        .catch(err => console.error("Error fetching cafes data:", err));

    // Cập nhật popup khi đổi phương tiện
    travelModeSelect.addEventListener('change', () => {
        map.eachLayer(layer => {
            if (layer instanceof L.Marker && layer.isPopupOpen && layer.isPopupOpen()) {
                layer.fire('click');
            }
        });
    });
});
//-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------
//Hàm chạy ổn: Vẽ đường, khoảng cách, thời gian, phương tiện, tìm marker gần nhất, đổi màu
window.addEventListener('load', () => {
    let userLocation = null;
    let routingControl = null;
    let allCafes = [];

    // Dropdown phương tiện
    const travelModeSelect = document.createElement('select');
    travelModeSelect.id = 'travelMode';
    travelModeSelect.className = 'form-select d-inline-block w-auto me-2 mb-2';
    ['walking', 'bicycle', 'motorbike', 'car', 'bus'].forEach(mode => {
        const option = document.createElement('option');
        option.value = mode;
        option.textContent = {
            walking: '🚶 Đi bộ',
            bicycle: '🚴 Xe đạp',
            motorbike: '🏍️ Xe máy',
            car: '🚗 Ô tô',
            bus: '🚌 Xe buýt'
        }[mode];
        travelModeSelect.appendChild(option);
    });

    // Nút tìm gần nhất
    const nearestBtn = document.createElement('button');
    nearestBtn.textContent = '📍 Tìm quán gần nhất';
    nearestBtn.className = 'btn btn-success mb-2';
    nearestBtn.addEventListener('click', goToNearest);

    // Nút huỷ chỉ đường
    const clearRouteBtn = document.createElement('button');
    clearRouteBtn.textContent = '❌ Huỷ chỉ đường';
    clearRouteBtn.className = 'btn btn-danger ms-2 mb-2';
    clearRouteBtn.addEventListener('click', clearRoute);

    // Thêm vào giao diện
    const wrapper = document.querySelector('.auto-search-wrapper');
    if (wrapper) {
        wrapper.appendChild(travelModeSelect);
        wrapper.appendChild(nearestBtn);
        wrapper.appendChild(clearRouteBtn); // 👈 thêm vào đây
    }

    // Lấy vị trí người dùng
    navigator.geolocation.getCurrentPosition(
        position => {
            userLocation = [position.coords.latitude, position.coords.longitude];
            L.marker(userLocation).addTo(map).bindPopup("📍 Vị trí của bạn").openPopup();

            L.circle(userLocation, {
                radius: 200,
                color: 'red',
                fillColor: '#f03',
                fillOpacity: 0.2
            }).addTo(map);

            map.setView(userLocation, 15);
        },
        error => {
            console.error("Không thể lấy vị trí người dùng:", error);
        }
    );

    function getCurrentMode() {
        return document.getElementById('travelMode').value;
    }

    function calculateDistance(coord1, coord2) {
        const R = 6371e3;
        const toRad = deg => deg * Math.PI / 180;
        const [lat1, lon1] = coord1.map(toRad);
        const [lat2, lon2] = coord2.map(toRad);
        const dLat = lat2 - lat1;
        const dLon = lon2 - lon1;
        const a = Math.sin(dLat / 2) ** 2 +
                  Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    function estimateTravelTime(distance, mode) {
        const speed = {
            walking: 5,
            bicycle: 15,
            motorbike: 40,
            car: 50,
            bus: 30
        }[mode] || 5;
        return Math.round((distance / 1000) / speed * 60);
    }

    function showRoute(destination) {
        if (!userLocation) {
            alert("Không lấy được vị trí người dùng.");
            return;
        }
        if (routingControl) map.removeControl(routingControl);

        clearRoute(); // 👈 gọi xoá tuyến cũ


        // 👉 Ghi lại marker đang mở popup (nếu có)
        let openedPopupLayer = null;
        map.eachLayer(layer => {
            if (layer instanceof L.Marker && layer.isPopupOpen && layer.isPopupOpen()) {
                openedPopupLayer = layer;
            }
        });

        // Bước 2: Xóa tuyến đường cũ nếu có
        if (routingControl) {
            map.removeControl(routingControl);
        }



        // Màu sắc theo phương tiện
        const mode = getCurrentMode();
    const routeColors = {
        walking: '#4caf50',    // xanh lá
        bicycle: '#2196f3',    // xanh dương
        motorbike: '#ff9800',  // cam
        car: '#9c27b0',        // tím
        bus: '#f44336'         // đỏ
    };

        routingControl = L.Routing.control({
            waypoints: [
                L.latLng(userLocation),
                L.latLng(destination)
            ],
            routeWhileDragging: false,
            addWaypoints: false,
            draggableWaypoints: false,
            show: false,
            createMarker: () => null,
            lineOptions: {
                styles: [
                    { color: routeColors[mode] || 'blue', opacity: 0.8, weight: 5 }
                ]
            }

        }).addTo(map);

        // Bước 5: Mở lại popup sau khi vẽ xong
        if (openedPopupLayer) {
            setTimeout(() => {
                openedPopupLayer.openPopup();
            }, 300); // Chờ một chút để tuyến đường render xong
        }
    }

    function findNearestMarker(data, userLocation) {
        if (!userLocation) {
            alert("Chưa xác định được vị trí của bạn.");
            return;
        }

        let nearest = null;
        let minDistance = Infinity;

        data.forEach(cafe => {
            const distance = calculateDistance(userLocation, [cafe.latitude, cafe.longitude]);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = cafe;
            }
        });

        return nearest;
    }

    function goToNearest() {
        const nearest = findNearestMarker(allCafes, userLocation);
        if (nearest) {
            alert(`📍 Quán gần nhất là: ${nearest.name}`);
            showRoute([nearest.latitude, nearest.longitude]);
        }
    }
    function clearRoute() {
        if (routingControl) {
            map.removeControl(routingControl);
            routingControl = null;
        }

          // Đóng tất cả popup đang mở
    map.eachLayer(layer => {
        if (layer instanceof L.Marker && layer.isPopupOpen && layer.isPopupOpen()) {
            layer.closePopup();
        }
    });
    }

    // Fetch & hiển thị marker
    fetch('/maps/api/cafes/')
        .then(response => response.json())
        .then(data => {
            allCafes = data; // lưu lại để dùng tìm gần nhất
            const pA = new L.FeatureGroup();

            data.forEach(cafe => {
                const { latitude, longitude, name, address, hours } = cafe;
                const marker = L.marker([latitude, longitude], { icon: cafeIcon });

                marker.on('popupopen', () => marker.isPopupOpen = () => true);
                marker.on('popupclose', () => marker.isPopupOpen = () => false);

                marker.on('click', () => {
                    if (!userLocation) return;

                    const mode = getCurrentMode();
                    const distance = calculateDistance(userLocation, [latitude, longitude]);
                    const time = estimateTravelTime(distance, mode);

                    const popupDiv = document.createElement('div');
                    popupDiv.innerHTML = `
                        <b>${name}</b><br>
                        <strong>Địa chỉ:</strong> ${address}<br>
                        <strong>Giờ mở cửa:</strong> ${hours}<br>
                        <strong>Khoảng cách:</strong> ${(distance / 1000).toFixed(2)} km<br>
                        <strong>Thời gian dự kiến:</strong> ${time} phút<br>
                        <a href="https://www.google.com/maps/search/?q=${latitude},${longitude}" target="_blank">Xem trên bản đồ</a><br>
                    `;

                    const btn = document.createElement('button');
                    btn.textContent = '📍 Chỉ đường';
                    btn.className = 'btn btn-sm btn-primary mt-2';
                    btn.addEventListener('click', () => {
                        showRoute([latitude, longitude]);
                    });

                    popupDiv.appendChild(btn);

                    marker.unbindPopup();
                    marker.bindPopup(popupDiv).openPopup();
                });

                pA.addLayer(marker);
            });

            map.addLayer(pA);
        })
        .catch(err => console.error("Error fetching cafes data:", err));

    travelModeSelect.addEventListener('change', () => {
        // Nếu đang mở popup marker, cập nhật lại nội dung (nếu cần)
        map.eachLayer(layer => {
            if (layer instanceof L.Marker && layer.isPopupOpen && layer.isPopupOpen()) {
                layer.fire('click');
            }
        });

   // Nếu có tuyến đường hiện tại, vẽ lại với màu tương ứng mới
   if (routingControl) {
    const waypoints = routingControl.getWaypoints();
    if (waypoints.length === 2) {
        const destination = [waypoints[1].latLng.lat, waypoints[1].latLng.lng];
        showRoute(destination); // gọi lại để cập nhật màu
    }
}


    });
});
//-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------
//Nội dung marker
const popupDiv = document.createElement('div');
popupDiv.innerHTML = `
    <b>${name}</b><br>
    <img src="/static/images/${image}" alt="${name}" style="width: 100%; height: auto; max-height: 150px; object-fit: cover; margin-top: 5px; margin-bottom: 5px;"><br>
    <strong>Địa chỉ:</strong> ${address}<br>
    <strong>Giờ mở cửa:</strong> ${hours}<br>
    <strong>Khoảng cách:</strong> ${(distance / 1000).toFixed(2)} km<br>
    <strong>Thời gian dự kiến:</strong> ${time} phút<br>
    <a href="https://www.google.com/maps/search/?q=${latitude},${longitude}" target="_blank">Xem trên bản đồ</a><br>
`;

const btn = document.createElement('button');
btn.textContent = '📍 Chỉ đường';
btn.className = 'btn btn-sm btn-primary mt-2';
btn.addEventListener('click', () => {
    showRoute([latitude, longitude]);
});

popupDiv.appendChild(btn);

marker.unbindPopup();
marker.bindPopup(popupDiv).openPopup();

//-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------