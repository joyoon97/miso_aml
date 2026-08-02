// 서비스 워커 — PWA 설치 + 푸시 알림 처리
self.addEventListener("install", function (e) {
  self.skipWaiting();
});
self.addEventListener("activate", function (e) {
  self.clients.claim();
});
self.addEventListener("fetch", function (e) {
  // 네트워크 우선 (오프라인 캐시 없음 — 항상 최신 데이터 사용)
});

// 안 읽은 알림 개수 (앱 아이콘 배지용)
var unreadCount = 0;

function updateBadge(n) {
  if (navigator.setAppBadge) {
    if (n > 0) navigator.setAppBadge(n);
    else navigator.clearAppBadge();
  }
}

// 푸시 알림 수신
self.addEventListener("push", function (e) {
  var data = { title: "AML Q&A", body: "" };
  try { data = e.data.json(); } catch (err) {
    if (e.data) data.body = e.data.text();
  }
  unreadCount++;
  updateBadge(unreadCount);
  e.waitUntil(
    self.registration.showNotification(data.title || "AML Q&A", {
      body: data.body || "",
      icon: "icons/icon-192.png",
      badge: "icons/badge-96.png"
    })
  );
});

// 앱에서 배지 초기화 요청 수신
self.addEventListener("message", function (e) {
  if (e.data && e.data.type === "CLEAR_BADGE") {
    unreadCount = 0;
    updateBadge(0);
  }
});

// 알림 클릭 시 앱 열기
self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  unreadCount = 0;
  updateBadge(0);
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        if ("focus" in list[i]) return list[i].focus();
      }
      return clients.openWindow("./");
    })
  );
});
