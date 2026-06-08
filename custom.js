/* =============================================
   더벤티 매장 찾기 — app.js
   ============================================= */

// ── 가상 매장 데이터 ───────────────────────────
const STORES = [
  {
    id: 1,
    name: '더벤티 강남본점',
    address: '서울특별시 강남구 테헤란로 152',
    hours: '07:00 – 22:00',
    phone: '02-555-1001',
    isOpen: true,
    lat: 37.5006,
    lng: 127.0366,
  },
  {
    id: 2,
    name: '더벤티 홍대점',
    address: '서울특별시 마포구 와우산로 29길 18',
    hours: '08:00 – 23:00',
    phone: '02-323-2002',
    isOpen: true,
    lat: 37.5546,
    lng: 126.9236,
  },
  {
    id: 3,
    name: '더벤티 여의도점',
    address: '서울특별시 영등포구 여의대로 108',
    hours: '07:30 – 21:00',
    phone: '02-782-3003',
    isOpen: false,
    lat: 37.5215,
    lng: 126.9242,
  },
  {
    id: 4,
    name: '더벤티 성수점',
    address: '서울특별시 성동구 성수이로 77',
    hours: '09:00 – 22:00',
    phone: '02-466-4004',
    isOpen: true,
    lat: 37.5446,
    lng: 127.0556,
  },
  {
    id: 5,
    name: '더벤티 이태원점',
    address: '서울특별시 용산구 이태원로 192',
    hours: '10:00 – 24:00',
    phone: '02-793-5005',
    isOpen: true,
    lat: 37.5344,
    lng: 126.9941,
  },
];

// ── 상태 ───────────────────────────────────────
let map = null;
let markers = [];
let infoWindow = null;
let searchCircle = null;
let searchMarker = null;
let activeStoreId = null;

// ── 지도 초기화 ────────────────────────────────
function initMap() {
  const center = new naver.maps.LatLng(37.5200, 126.9800);

  map = new naver.maps.Map('map', {
    center,
    zoom: 12,
    mapTypeControl: false,
    zoomControl: true,
    zoomControlOptions: {
      style: naver.maps.ZoomControlStyle.SMALL,
      position: naver.maps.Position.TOP_RIGHT,
    },
    scaleControl: false,
    logoControl: false,
  });

  infoWindow = new naver.maps.InfoWindow({
    borderWidth: 0,
    backgroundColor: 'transparent',
    disableAnchor: true,
    pixelOffset: new naver.maps.Point(0, -8),
  });

  renderMarkers();
  renderStoreList();
  bindEvents();
}

// ── 마커 렌더링 ────────────────────────────────
function renderMarkers() {
  STORES.forEach(store => {
    const marker = new naver.maps.Marker({
      position: new naver.maps.LatLng(store.lat, store.lng),
      map,
      icon: buildMarkerIcon(false),
      title: store.name,
    });

    marker.storeId = store.id;

    naver.maps.Event.addListener(marker, 'click', () => {
      selectStore(store.id);
    });

    markers.push({ id: store.id, marker });
  });
}

function buildMarkerIcon(active) {
  const bg = active ? '#C44343' : '#fff';
  const stroke = active ? '#C44343' : '#C44343';
  const dot = active ? '#fff' : '#C44343';
  const shadow = active ? '0 2px 8px rgba(196,67,67,0.4)' : '0 2px 6px rgba(0,0,0,0.15)';

  return {
    content: `
      <div style="
        width:32px; height:32px; border-radius:50%;
        background:${bg}; border:2px solid ${stroke};
        display:flex; align-items:center; justify-content:center;
        box-shadow:${shadow};
        transition:all 0.15s;
        cursor:pointer;
      ">
        <div style="
          width:8px; height:8px; border-radius:50%;
          background:${dot};
        "></div>
      </div>`,
    size: new naver.maps.Size(32, 32),
    anchor: new naver.maps.Point(16, 16),
  };
}

// ── 매장 목록 렌더링 ───────────────────────────
function renderStoreList() {
  const list = document.getElementById('storeList');
  list.innerHTML = '';

  STORES.forEach(store => {
    const li = document.createElement('li');
    li.className = 'store-item';
    li.dataset.id = store.id;
    li.innerHTML = `
      <div class="store-item-top">
        <span class="store-name">${store.name}</span>
        <span class="store-badge ${store.isOpen ? 'open' : 'closed'}">
          ${store.isOpen ? '영업중' : '영업종료'}
        </span>
      </div>
      <p class="store-address">${store.address}</p>
      <div class="store-meta">
        <span>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          ${store.hours}
        </span>
        <span>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81 19.79 19.79 0 01.07 2.18 2 2 0 012.07 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
          </svg>
          ${store.phone}
        </span>
      </div>
    `;

    li.addEventListener('click', () => selectStore(store.id));
    list.appendChild(li);
  });
}

// ── 매장 선택 ──────────────────────────────────
function selectStore(storeId) {
  const store = STORES.find(s => s.id === storeId);
  if (!store) return;

  // 이전 활성 상태 해제
  if (activeStoreId !== null) {
    const prevMarkerObj = markers.find(m => m.id === activeStoreId);
    if (prevMarkerObj) prevMarkerObj.marker.setIcon(buildMarkerIcon(false));

    const prevItem = document.querySelector(`.store-item[data-id="${activeStoreId}"]`);
    if (prevItem) prevItem.classList.remove('active');
  }

  activeStoreId = storeId;

  // 현재 활성화
  const markerObj = markers.find(m => m.id === storeId);
  if (markerObj) markerObj.marker.setIcon(buildMarkerIcon(true));

  const item = document.querySelector(`.store-item[data-id="${storeId}"]`);
  if (item) {
    item.classList.add('active');
    item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // 지도 이동
  const position = new naver.maps.LatLng(store.lat, store.lng);
  map.panTo(position, { duration: 300, easing: 'easeOutCubic' });

  // 인포윈도우
  showInfoWindow(store, markerObj.marker);
}

function showInfoWindow(store, marker) {
  const content = `
    <div class="info-window">
      <div class="info-title">${store.name}</div>
      <div class="info-addr">${store.address}</div>
      <div class="info-row">
        <span>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          ${store.hours}
        </span>
        <span>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81 19.79 19.79 0 01.07 2.18 2 2 0 012.07 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
          </svg>
          ${store.phone}
        </span>
      </div>
    </div>`;

  infoWindow.setContent(content);
  infoWindow.open(map, marker);
}

// ── 주소 검색 ──────────────────────────────────
function searchAddress(query) {
  const meta = document.getElementById('searchMeta');
  meta.className = 'search-meta';
  meta.textContent = '검색 중...';

  naver.maps.Service.geocode({ query }, (status, response) => {
    if (status !== naver.maps.Service.Status.OK) {
      meta.className = 'search-meta error';
      meta.textContent = '검색 결과가 없습니다.';
      return;
    }

    const result = response.v2.addresses[0];
    if (!result) {
      meta.className = 'search-meta error';
      meta.textContent = '검색 결과가 없습니다.';
      return;
    }

    const lat = parseFloat(result.y);
    const lng = parseFloat(result.x);
    const position = new naver.maps.LatLng(lat, lng);

    meta.className = 'search-meta success';
    meta.textContent = result.roadAddress || result.jibunAddress;

    // 이전 검색 요소 제거
    clearSearchOverlays();

    // 검색 위치 마커
    searchMarker = new naver.maps.Marker({
      position,
      map,
      icon: {
        content: `
          <div style="
            width:14px; height:14px; border-radius:50%;
            background:#C44343; border:3px solid #fff;
            box-shadow:0 0 0 2px #C44343;
          "></div>`,
        size: new naver.maps.Size(14, 14),
        anchor: new naver.maps.Point(7, 7),
      },
    });

    // 반경 1km 원
    searchCircle = new naver.maps.Circle({
      map,
      center: position,
      radius: 1000,
      fillColor: '#C44343',
      fillOpacity: 0.06,
      strokeColor: '#C44343',
      strokeOpacity: 0.35,
      strokeWeight: 1.5,
      strokeStyle: 'shortdash',
    });

    map.panTo(position, { duration: 400, easing: 'easeOutCubic' });
    map.setZoom(14, true);

    // 인포윈도우 닫기
    infoWindow.close();
  });
}

function clearSearchOverlays() {
  if (searchMarker) { searchMarker.setMap(null); searchMarker = null; }
  if (searchCircle) { searchCircle.setMap(null); searchCircle = null; }
}

// ── 지도 타입 전환 ─────────────────────────────
function setMapType(type) {
  const mapType = type === 'satellite'
    ? naver.maps.MapTypeId.HYBRID
    : naver.maps.MapTypeId.NORMAL;

  map.setMapTypeId(mapType);

  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });
}

// ── 이벤트 바인딩 ──────────────────────────────
function bindEvents() {
  const input = document.getElementById('searchInput');
  const btn = document.getElementById('searchBtn');

  btn.addEventListener('click', () => {
    const q = input.value.trim();
    if (q) searchAddress(q);
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const q = input.value.trim();
      if (q) searchAddress(q);
    }
  });

  document.getElementById('typeNormal').addEventListener('click', () => setMapType('normal'));
  document.getElementById('typeSatellite').addEventListener('click', () => setMapType('satellite'));

  // 지도 클릭 시 인포윈도우 닫기
  naver.maps.Event.addListener(map, 'click', () => {
    infoWindow.close();

    if (activeStoreId !== null) {
      const markerObj = markers.find(m => m.id === activeStoreId);
      if (markerObj) markerObj.marker.setIcon(buildMarkerIcon(false));

      const item = document.querySelector(`.store-item[data-id="${activeStoreId}"]`);
      if (item) item.classList.remove('active');

      activeStoreId = null;
    }
  });
}

// ── 실행 ───────────────────────────────────────
window.addEventListener('load', initMap);