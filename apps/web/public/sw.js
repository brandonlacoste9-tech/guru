self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/favicon.ico', // Update with actual app icon
      badge: '/favicon.ico',
      data: data.data,
      actions: [
        { action: 'view', title: 'View Details' },
        { action: 'close', title: 'Dismiss' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    const guruId = event.notification.data?.guruId;
    const url = guruId ? `/dashboard?guru=${guruId}` : '/dashboard';
    
    event.waitUntil(
      clients.openWindow(url)
    );
  }
});
