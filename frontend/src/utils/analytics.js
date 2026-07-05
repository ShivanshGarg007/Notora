// Track custom events
export const trackEvent = (eventName, eventParams = {}) => {
  if (window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
};

// Track user actions
export const trackUserAction = {
  // Authentication events
  login: (method) => trackEvent('login', { method }),
  signup: (method) => trackEvent('signup', { method }),
  logout: () => trackEvent('logout'),

  // Note events
  viewNote: (noteId, title, subject) => trackEvent('view_note', { noteId, title, subject }),
  downloadNote: (noteId, title, subject) => trackEvent('download_note', { noteId, title, subject }),
  uploadNote: (subject, isPremium) => trackEvent('upload_note', { subject, isPremium }),

  // Premium events
  viewPremiumContent: (contentType) => trackEvent('view_premium_content', { contentType }),
  upgradeToPremium: (plan) => trackEvent('upgrade_premium', { plan }),

  // OCR events
  processImage: (imageType) => trackEvent('process_image', { imageType }),

  // Chat events
  joinChatRoom: (roomId) => trackEvent('join_chat_room', { roomId }),
  sendMessage: (roomId) => trackEvent('send_message', { roomId }),

  // Search events
  searchNotes: (query, filters) => trackEvent('search_notes', { query, filters }),
}; 