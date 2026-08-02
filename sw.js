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

// 푸시 알림 수신
self.addEventListener("push", function (e) {
  var data = { title: "AML Q&A", body: "" };
  try { data = e.data.json(); } catch (err) {
    if (e.data) data.body = e.data.text();
  }
  e.waitUntil(
    self.registration.showNotification(data.title || "AML Q&A", {
      body: data.body || "",
      icon: "icons/icon-192.png",
      badge: "icons/icon-192.png"
    })
  );
});

// 알림 클릭 시 앱 열기
self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        if ("focus" in list[i]) return list[i].focus();
      }
      return clients.openWindow("./");
    })
  );
});
