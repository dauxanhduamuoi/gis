// Cấu hình bản đồ
let config = {
    minZoom: 7,
    maxZoom: 18,
    fullscreenControl: true, // Thêm button fullscreen trên bản đồ
    zoom: 12,
    disableDefaultUI: false,
    
};

// Độ phóng đại khi bản đồ được mở
const zoom = 18;

// Toạ độ mặc định
const lat = 10.796501883372228;
const lng = 106.66680416611385;

// Khởi tạo bản đồ
const map = L.map("map", config).setView([lat, lng], zoom);
map.attributionControl.setPrefix(false);

const MapControl = L.Control.extend({
    onAdd: function(map) {
        const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');

        div.innerHTML = `
            <div style="background: white; padding: 10px; border-radius: 8px; width: 180px; font-size: 14px; box-shadow: 0 2px 6px rgba(0,0,0,0.2);">
                <label for="modeSelect" ><strong>Phương tiện:</strong></label>
                <select id="modeSelect" class="form-select form-select-sm" style="width: 100%; margin-bottom: 8px;">
                    <option value="motorbike">🏍️ Xe máy</option>
                    <option value="car">🚗 Xe hơi</option>
                    <option value="walking">🚶‍♂️ Đi bộ</option>
                </select>
                <button id="nearestBtn" class="btn btn-sm btn-success" style="width: 100%; margin-bottom: 5px;">🔍 Gần nhất</button>
                <button id="clearRouteBtn" class="btn btn-sm btn-danger" style="width: 100%;">❌ Huỷ chỉ đường</button>
            </div>
        `;
setTimeout(() => {
    document.getElementById('modeSelect').addEventListener('change', () => {
        updateRouteWithNewMode(); // cập nhật tuyến đường nếu cần
    });

    document.getElementById('nearestBtn').addEventListener('click', () => {
        if (!userLocation || allCafes.length === 0) return;

        let minDistance = Infinity;
        let nearestCafe = null;

        allCafes.forEach(cafe => {
            const distance = calculateDistance(userLocation, [cafe.latitude, cafe.longitude]);
            if (distance < minDistance) {
                minDistance = distance;
                nearestCafe = cafe;
            }
        });

        if (nearestCafe) {
            map.setView([nearestCafe.latitude, nearestCafe.longitude], 16);
            showRoute([nearestCafe.latitude, nearestCafe.longitude]);
        }
    });

    document.getElementById('clearRouteBtn').addEventListener('click', () => {
        clearRoute();
    });
}, 500); // chờ DOM tạo control xong mới gán sự kiện
        // Ngăn bản đồ bị zoom khi click vào control
        L.DomEvent.disableClickPropagation(div);

        return div;
    }
});

map.addControl(new MapControl({ position: 'topright' }));





// Bước dựng để tải và trình các layer trên bản đồ
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; <a href='#'>LT GIS</a> cơ bản",
}).addTo(map);

// Xử lý định vị vị trí hiện tại
map.locate({
    setView: true,
    enableHighAccuracy: true,
})
    .on("locationfound", (e) => {
        // marker
        const marker = L.marker([e.latitude, e.longitude]).bindPopup("Bạn đang ở đây");
        const circle = L.circle([e.latitude, e.longitude], e.accuracy / 100, {
            weight: 2,
            color: "red",
            fillColor: "red",
            fillOpacity: 0.1,
        });

        map.addLayer(marker);
        map.addLayer(circle);
    })
    .on("locationerror", () => {
        alert("Location access denied.");
    });


    
    


// Tuỳ chỉnh icon marker
const funny = L.icon({
    //iconUrl: "https://cntt.pnk.io.vn/ts-map-pin.png",
    iconUrl: "https://cdn-icons-png.flaticon.com/512/4615/4615221.png",
    iconSize: [50, 58],
    iconAnchor: [22, 58],
    popupAnchor: [0, -60],
});

// Nội dung popup tùy chỉnh
const customPopup = `
    <iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ
"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerpolicy="strict-origin-when-cross-origin" allowfullscreen>
    </iframe>
`;

// Tuỳ chỉnh popup
const customOptions = {
    maxWidth: "auto",
    className: "customPopup",
};

// Thêm marker vào bản đồ
L.marker([lat, lng], { icon: funny })
    .bindPopup(customPopup, customOptions)
    .addTo(map);

// Xử lý tìm kiếm địa điểm với Autocomplete
window.addEventListener("DOMContentLoaded", function () {
    new Autocomplete("search", {
        delay: 1000,
        selectFirst: true,
        howManyCharacters: 2,

        onSearch: function ({ currentValue }) {
            const api = `https://nominatim.openstreetmap.org/search?format=geojson&limit=5&q=${encodeURI(currentValue)}`;

            return new Promise((resolve) => {
                fetch(api)
                    .then((response) => response.json())
                    .then((data) => {
                        console.log("Dữ liệu từ API:", data); // Debug dữ liệu trả về
                        resolve(data.features);
                    })
                    .catch((error) => {
                        console.error("Lỗi gọi API:", error);
                    });
            });
        },

        // Xử lý kết quả từ API
        onResults: ({ currentValue, matches, template }) => {
            if (matches.length === 0) return template(`<li>No results found: "${currentValue}"</li>`);

            return matches
                .map((element) => {
                    return `
                        <li class="loupe" role="option">
                            ${element.properties.display_name.replace(
                        new RegExp(currentValue, "i"),
                        (str) => `<b>${str}</b>`
                    )}
                        </li>`;
                })
                .join("");
        },

        onSubmit: ({ object }) => {
            const { display_name } = object.properties;
            const coord = object.geometry.coordinates;

            // Xóa marker cũ nếu có
            map.eachLayer(function (layer) {
                if (layer instanceof L.Marker && !layer._icon.classList.contains("leaflet-marker-icon")) {
                    map.removeLayer(layer);
                }
            });

            // Tạo marker mới
            const marker = L.marker([coord[1], coord[0]], {
                title: display_name,
            });

            marker.addTo(map).bindPopup(display_name).openPopup();
            map.setView([coord[1], coord[0]], 14);
        },

        onSelectedItem: ({ index, element, object }) => {
            console.log("onSelectedItem:", index, element, object);
        },

        noResults: ({ currentValue, template }) =>
            template(`<li>No results found: "${currentValue}"</li>`),
    });

    // Thêm phần chú thích trên bản đồ
    // const legend = L.control({ position: "bottomleft" });

    // legend.onAdd = function () {
    //     let div = L.DomUtil.create("div", "description");
    //     L.DomEvent.disableClickPropagation(div);

    //     const text =
    //         "<b>Thu Điếu - Nguyễn Khuyến</b><br>" +
    //         "Ao thu lạnh lẽo nước trong veo,<br>" +
    //         "Một chiếc thuyền câu bé tẻo teo.<br>" +
    //         "Sóng biếc theo làn hơi gợn tí,<br>" +
    //         "Lá vàng trước gió sẽ đưa vèo.<br>" +
    //         "Tầng mây lơ lửng trời xanh ngắt,<br>" +
    //         "Ngõ trúc quanh co khách vắng teo.<br>" +
    //         "Tựa gối, ôm cần lâu chẳng được,<br>" +
    //         "Cá đâu đớp động dưới chân bèo.<br>";

    //     div.insertAdjacentHTML("beforeend", text);
    //     return div;
    // };

    // legend.addTo(map);


});



//Bài 6

// [topleft, topright, bottomleft, bottomright] 
L.control.zoom({ position: "topright" }).addTo(map);

// holder for all articles 
const articles = document.querySelectorAll("article");

// setting a marker 
function setMarker([lat, lng], title) {
    const marker = L.marker([lat, lng], { title });
    // add a marker to the map and create a popup 
    marker.addTo(map).bindPopup(title);
}

// map centering 
function centerMap([lat, lng], target, title) {
    const active = target.classList.contains("active");

    // set the map to lat coordinates, lng 
    map.setView([lat, lng], 16);

    // checking if the active class is already 
    // set, if not, set the marker 
    if (!active) {
        setMarker([lat, lng], title);
    }
}

// helper function to intersectionObserver 
function onChange(changes) {
    changes.forEach(function (change) {
        // get data from html coordinates element 
        const data = change.target.dataset.coordinates;
        // get title from html 
        const title = change.target.dataset.title;

        if (change.intersectionRatio > 0) {
            // center map 
            centerMap(JSON.parse(data), change.target, title);
            // add class to article 
            change.target.classList.add("active");
        }
    });
}

// checking if IntersectionObserver is supported 
if ("IntersectionObserver" in window) {
    const config = {
        root: null,
        rootMargin: "0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
    };

    let observer = new IntersectionObserver(onChange, config);
    articles.forEach(function (article) {
        observer.observe(article);
    });
}
//--------------------------------------------------------------------------------
//--------------------------------------------------------------------------------
let pointsCafe = [
    [10.796277842333827, 106.66692171944823, "CỒ Tea House & Coffee"],
    [10.79607043221434, 106.6674328521939, "Coi Xua Cafe"],
    [10.795703256899937, 106.66683504293746, "BINISUN COFFEE & TEA"],
    [10.795117136725134, 106.66643199662028, "Sung Cà Phê"],
];

let pointsCafe2 = [
    [10.796277842333827, 106.66692171944823, "CỒ Tea House & Coffee", "123 Nguyễn Huệ, Quận 1", "8:00 AM - 10:00 PM"],
    [10.79607043221434, 106.6674328521939, "Coi Xua Cafe", "45 Lý Tự Trọng, Quận 1", "7:30 AM - 9:00 PM"],
    [10.795703256899937, 106.66683504293746, "BINISUN COFFEE & TEA", "89 Đinh Tiên Hoàng, Quận 1", "8:30 AM - 10:30 PM"],
    [10.795117136725134, 106.66643199662028, "Sung Cà Phê", "21 Hai Bà Trưng, Quận 3", "7:00 AM - 8:00 PM"],
];

// Tạo một icon mới cho marker quán cà phê
const cafeIcon = L.icon({
iconUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS36Y2839nkzCHup4nPdZsgtmgJHI_yuByy5w&s', // Đặt URL của hình ảnh bạn muốn sử dụng làm icon
iconSize: [40, 40], // Kích thước của icon
iconAnchor: [20, 40], // Vị trí neo của icon (tính từ góc dưới)
popupAnchor: [0, -40], // Vị trí của popup so với icon
});
// Thêm markers vào bản đồ
// const pA = new L.FeatureGroup();
// pointsCafe.forEach(([lat, lng, popupText]) => {
//     const marker = L.marker([lat, lng], { icon: cafeIcon }).bindPopup(popupText);
//     pA.addLayer(marker);
// });
// map.addLayer(pA);

//Hiển thị các quán cafe
// const pA = new L.FeatureGroup();
// pointsCafe2.forEach(([lat, lng, name, address, hours]) => {
//     const marker = L.marker([lat, lng], { icon: cafeIcon })
//         .bindPopup(`
//             <b>${name}</b><br>
//             <strong>Địa chỉ:</strong> ${address}<br>
//             <strong>Giờ mở cửa:</strong> ${hours}<br>
//             <a href="https://www.google.com/maps/search/?q=${lat},${lng}" target="_blank">Xem trên bản đồ</a>
//         `);
//     pA.addLayer(marker);
//     map.addLayer(pA);
// });
//--------------------------------------------------------------------------------
//--------------------------------------------------------------------------------


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

function clearRoute() {
    if (routeControl) {
        map.removeControl(routeControl);
        routeControl = null;
    }
}

function getCurrentMode() {
    return document.getElementById('modeSelect').value;
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
            console.log("Dữ liệu trả về:", data);
            allCafes = data; // lưu lại để dùng tìm gần nhất
            const pA = new L.FeatureGroup();

            data.forEach(cafe => {
                const { latitude, longitude, name, address, hours, image } = cafe;
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
                            <div style="font-family: 'Arial', sans-serif; max-width: 250px;">
                                <h5 style="margin: 0 0 5px 0; font-size: 16px; color: #d13f19;">${name}</h5>
                                <img src="/static/images/${image}" alt="${name}" style="width: 100%; height: auto; max-height: 140px; object-fit: cover; border-radius: 6px; margin-bottom: 8px;">
                                <p style="margin: 0 0 4px 0;"><strong>📍 Địa chỉ:</strong> ${address}</p>
                                <p style="margin: 0 0 4px 0;"><strong>🕒 Giờ mở cửa:</strong> ${hours}</p>
                                <p style="margin: 0 0 4px 0;"><strong>📏 Khoảng cách:</strong> ${(distance / 1000).toFixed(2)} km</p>
                                <p style="margin: 0 0 4px 0;"><strong>⏱️ Thời gian dự kiến:</strong> ${time} phút</p>
                                <a href="https://www.google.com/maps/search/?q=${latitude},${longitude}" target="_blank" style="display: inline-block; margin-top: 6px; color: #007bff; text-decoration: none;">🔗 Xem trên Google Maps</a><br>
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

                        marker.unbindPopup();
                        marker.bindPopup(popupDiv).openPopup();
                    });

                pA.addLayer(marker);
            });

            map.addLayer(pA);


  // ✅ Sau khi thêm marker xong, gắn sự kiện cập nhật thời gian khi đổi phương tiện
  document.getElementById('modeSelect').addEventListener('change', () => {
    const selectedMode = getCurrentMode();

    updateRouteWithNewMode(); // Cập nhật tuyến đường nếu có

    // Tìm marker đang mở popup
    map.eachLayer(layer => {
        if (layer instanceof L.Marker && typeof layer.isPopupOpen === 'function' && layer.isPopupOpen()) {
            const { latitude, longitude, name, address, hours, image } = layer.options.cafeData;
            const distance = calculateDistance(userLocation, [latitude, longitude]);
            const time = estimateTravelTime(distance, selectedMode);

            const popupDiv = document.createElement('div');
            popupDiv.innerHTML = `
                <div style="font-family: 'Arial', sans-serif; max-width: 250px;">
                    <h5 style="margin: 0 0 5px 0; font-size: 16px; color: #d13f19;">${name}</h5>
                    <img src="/static/images/${image}" alt="${name}" style="width: 100%; height: auto; max-height: 140px; object-fit: cover; border-radius: 6px; margin-bottom: 8px;">
                    <p style="margin: 0 0 4px 0;"><strong>📍 Địa chỉ:</strong> ${address}</p>
                    <p style="margin: 0 0 4px 0;"><strong>🕒 Giờ mở cửa:</strong> ${hours}</p>
                    <p style="margin: 0 0 4px 0;"><strong>📏 Khoảng cách:</strong> ${(distance / 1000).toFixed(2)} km</p>
                    <p style="margin: 0 0 4px 0;"><strong>⏱️ Thời gian dự kiến:</strong> ${time} phút</p>
                    <a href="https://www.google.com/maps/search/?q=${latitude},${longitude}" target="_blank" style="display: inline-block; margin-top: 6px; color: #007bff; text-decoration: none;">🔗 Xem trên Google Maps</a><br>
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
            layer.setPopupContent(popupDiv);
        }
    });
});


        })
        .catch(err => console.error("Error fetching cafes data:", err));

    travelModeSelect.addEventListener('change', () => {
        // Nếu đang mở popup marker, cập nhật lại nội dung (nếu cần)
        map.eachLayer(layer => {
            if (layer instanceof L.Marker && layer.isPopupOpen && layer.isPopupOpen()) {
                layer.fire('click');
            }
        })

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












    





