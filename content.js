(function() {
  let backgroundDiv = null;
  let overlayDiv = null;
  
  // Initialize background handler
  function initBackground() {
    // Remove any existing background div
    if (backgroundDiv) {
      backgroundDiv.remove();
    }
    
    if (overlayDiv) {
      overlayDiv.remove();
    }
    
    // Create new background div
    backgroundDiv = document.createElement('div');
    backgroundDiv.id = 'twitter-x-custom-background';
    document.body.prepend(backgroundDiv);
    
    // Create overlay div
    overlayDiv = document.createElement('div');
    overlayDiv.id = 'twitter-x-custom-overlay';
    document.body.prepend(overlayDiv);
    
    // Load saved background settings
    chrome.storage.local.get([
      'backgroundImage', 
      'opacity', 
      'blur', 
      'brightness', 
      'overlayColor', 
      'overlayOpacity'
    ], function(result) {
      if (result.backgroundImage) {
        applyBackground(
          result.backgroundImage, 
          result.opacity || 0.5, 
          result.blur || 0, 
          result.brightness || 100,
          result.overlayColor || '#000000',
          result.overlayOpacity || 0
        );
      }
    });
  }
  
  // Apply background image with all settings
  function applyBackground(imageUrl, opacity, blur, brightness, overlayColor, overlayOpacity) {
    if (!backgroundDiv || !overlayDiv) {
      initBackground();
    }
    
    // Set the background image
    backgroundDiv.style.backgroundImage = `url("${imageUrl}")`;
    backgroundDiv.style.opacity = opacity;
    backgroundDiv.style.filter = `blur(${blur}px) brightness(${brightness}%)`;
    
    // Set the overlay
    overlayDiv.style.backgroundColor = overlayColor;
    overlayDiv.style.opacity = overlayOpacity;
  }
  
  // Reset background to default
  function resetBackground() {
    if (backgroundDiv) {
      backgroundDiv.style.backgroundImage = 'none';
      backgroundDiv.style.filter = 'none';
    }
    
    if (overlayDiv) {
      overlayDiv.style.backgroundColor = 'transparent';
      overlayDiv.style.opacity = 0;
    }
  }
  
  // Listen for messages from popup
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === 'updateBackground') {
      applyBackground(
        message.backgroundImage, 
        message.opacity, 
        message.blur, 
        message.brightness,
        message.overlayColor,
        message.overlayOpacity
      );
    } else if (message.action === 'resetBackground') {
      resetBackground();
    }
    sendResponse({success: true});
  });
  
  // Initialize when page loads
  window.addEventListener('load', initBackground);
  
  // Re-initialize when navigation occurs (for SPA behavior)
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      setTimeout(initBackground, 500); // Small delay to ensure DOM is ready
    }
  }).observe(document, {subtree: true, childList: true});
  
  // Run initialization in case the page is already loaded
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initBackground();
  }
})();