// 최소 서비스 워커 — PWA 설치 요건 충족용
self.addEventListener("install", function (e) {
  self.skipWaiting();
});
self.addEventListener("activate", function (e) {
  self.clients.claim();
});
self.addEventListener("fetch", function (e) {
  // 네트워크 우선 (오프라인 캐시 없음 — 항상 최신 데이터 사용)
});
