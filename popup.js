document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const imageUrlInput = document.getElementById('image-url');
  const imageUploadInput = document.getElementById('image-upload');
  const opacityInput = document.getElementById('opacity');
  const opacityValue = document.getElementById('opacity-value');
  const blurInput = document.getElementById('blur');
  const blurValue = document.getElementById('blur-value');
  const brightnessInput = document.getElementById('brightness');
  const brightnessValue = document.getElementById('brightness-value');
  const overlayColorInput = document.getElementById('overlay-color');
  const overlayOpacityInput = document.getElementById('overlay-opacity');
  const overlayOpacityValue = document.getElementById('overlay-opacity-value');
  const previewImage = document.getElementById('preview-image');
  const previewContainer = document.getElementById('preview-container');
  const applyBtn = document.getElementById('apply-btn');
  const resetBtn = document.getElementById('reset-btn');
  const statusMsg = document.getElementById('status');
  const themeSelector = document.getElementById('theme-select');
  const savePresetBtn = document.getElementById('save-preset');
  const presetSelector = document.getElementById('preset-select');
  const deletePresetBtn = document.getElementById('delete-preset');
  
  // Initialize tabs
  initTabs();
  
  // Initialize theme toggle
  initThemeToggle();
  
  // Initialize preset system
  initPresets();
  
  // Load saved settings
  loadSavedSettings();
  
  // Initialize preview
  updatePreview();
  
  // Event listeners
  imageUrlInput.addEventListener('input', validateAndPreviewUrl);
  imageUploadInput.addEventListener('change', handleImageUpload);
  opacityInput.addEventListener('input', updateOpacityValue);
  blurInput.addEventListener('input', updateBlurValue);
  brightnessInput.addEventListener('input', updateBrightnessValue);
  overlayColorInput.addEventListener('input', updatePreview);
  overlayOpacityInput.addEventListener('input', updateOverlayOpacityValue);
  applyBtn.addEventListener('click', applyBackground);
  resetBtn.addEventListener('click', resetBackground);
  savePresetBtn.addEventListener('click', savePreset);
  presetSelector.addEventListener('change', loadPreset);
  deletePresetBtn.addEventListener('click', deletePreset);
  
  // All input controls that affect preview
  const allControls = [
    opacityInput, blurInput, brightnessInput, overlayColorInput, overlayOpacityInput
  ];
  allControls.forEach(control => {
    control.addEventListener('input', updatePreview);
  });
  
  // Functions
  function loadSavedSettings() {
    chrome.storage.local.get([
      'backgroundImage', 
      'opacity', 
      'blur', 
      'brightness', 
      'overlayColor', 
      'overlayOpacity',
      'theme'
    ], function(result) {
      // Set background image
      if (result.backgroundImage) {
        if (!result.backgroundImage.startsWith('data:')) {
          imageUrlInput.value = result.backgroundImage;
        }
        previewImage.src = result.backgroundImage;
        previewImage.style.display = 'block';
      }
      
      // Set other values
      if (result.opacity !== undefined) {
        opacityInput.value = result.opacity;
        opacityValue.textContent = result.opacity;
      }
      
      if (result.blur !== undefined) {
        blurInput.value = result.blur;
        blurValue.textContent = result.blur + 'px';
      }
      
      if (result.brightness !== undefined) {
        brightnessInput.value = result.brightness;
        brightnessValue.textContent = result.brightness + '%';
      }
      
      if (result.overlayColor) {
        overlayColorInput.value = result.overlayColor;
      }
      
      if (result.overlayOpacity !== undefined) {
        overlayOpacityInput.value = result.overlayOpacity;
        overlayOpacityValue.textContent = result.overlayOpacity;
      }
      
      // Set theme
      if (result.theme) {
        themeSelector.value = result.theme;
        applyTheme(result.theme);
      }
      
      updatePreview();
    });
  }
  
  function validateAndPreviewUrl() {
    const url = imageUrlInput.value.trim();
    
    if (!url) {
      return;
    }
    
    // Show loading state
    previewImage.style.display = 'none';
    statusMsg.textContent = 'Loading image...';
    
    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      statusMsg.textContent = 'Invalid URL format. Please enter a valid URL.';
      return;
    }
    
    // Try to load the image
    const tempImg = new Image();
    tempImg.onload = function() {
      previewImage.src = url;
      previewImage.style.display = 'block';
      statusMsg.textContent = '';
      updatePreview();
    };
    
    tempImg.onerror = function() {
      statusMsg.textContent = 'Error loading image. Please check the URL.';
    };
    
    tempImg.src = url;
  }
  
  function handleImageUpload() {
    const file = imageUploadInput.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        statusMsg.textContent = 'Image is too large. Please choose an image under 5MB.';
        return;
      }
      
      const reader = new FileReader();
      reader.onload = function(e) {
        previewImage.src = e.target.result;
        previewImage.style.display = 'block';
        imageUrlInput.value = ''; // Clear URL input when file is uploaded
        statusMsg.textContent = '';
        updatePreview();
      };
      reader.readAsDataURL(file);
    }
  }
  
  function updateOpacityValue() {
    opacityValue.textContent = opacityInput.value;
    updatePreview();
  }
  
  function updateBlurValue() {
    blurValue.textContent = blurInput.value + 'px';
    updatePreview();
  }
  
  function updateBrightnessValue() {
    brightnessValue.textContent = brightnessInput.value + '%';
    updatePreview();
  }
  
  function updateOverlayOpacityValue() {
    overlayOpacityValue.textContent = overlayOpacityInput.value;
    updatePreview();
  }
  
  function updatePreview() {
    if (!previewImage.src || previewImage.src === window.location.href) {
      return;
    }
    
    // Apply styles to preview
    previewContainer.style.setProperty('--bg-opacity', opacityInput.value);
    previewContainer.style.setProperty('--bg-blur', `${blurInput.value}px`);
    previewContainer.style.setProperty('--bg-brightness', `${brightnessInput.value}%`);
    previewContainer.style.setProperty('--overlay-color', overlayColorInput.value);
    previewContainer.style.setProperty('--overlay-opacity', overlayOpacityInput.value);
  }
  
  function applyBackground() {
    let backgroundImage = imageUrlInput.value.trim();
    
    // If we have an uploaded file, use that instead of URL
    if (imageUploadInput.files.length > 0) {
      backgroundImage = previewImage.src; // This contains the Data URL
    } else if (backgroundImage) {
      // Validate URL
      try {
        new URL(backgroundImage);
      } catch (e) {
        statusMsg.textContent = 'Invalid URL format. Please enter a valid URL.';
        return;
      }
    }
    
    if (!backgroundImage && !previewImage.src) {
      statusMsg.textContent = 'Please provide an image URL or upload an image.';
      return;
    }
    
    // If there's a preview but no specified source, get it from the preview
    if (!backgroundImage && previewImage.src && previewImage.src !== window.location.href) {
      backgroundImage = previewImage.src;
    }
    
    // Save all settings
    chrome.storage.local.set({
      'backgroundImage': backgroundImage,
      'opacity': opacityInput.value,
      'blur': blurInput.value,
      'brightness': brightnessInput.value,
      'overlayColor': overlayColorInput.value,
      'overlayOpacity': overlayOpacityInput.value
    }, function() {
      statusMsg.textContent = 'Background applied! Refresh Twitter/X if you don\'t see changes.';
      statusMsg.style.color = 'green';
      
      // Send message to content script
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0] && (tabs[0].url.includes('twitter.com') || tabs[0].url.includes('x.com'))) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'updateBackground',
            backgroundImage: backgroundImage,
            opacity: opacityInput.value,
            blur: blurInput.value,
            brightness: brightnessInput.value,
            overlayColor: overlayColorInput.value,
            overlayOpacity: overlayOpacityInput.value
          });
        }
      });
    });
  }
  
  function resetBackground() {
    chrome.storage.local.remove([
      'backgroundImage', 
      'opacity', 
      'blur', 
      'brightness', 
      'overlayColor', 
      'overlayOpacity'
    ], function() {
      // Reset form controls
      imageUrlInput.value = '';
      imageUploadInput.value = '';
      opacityInput.value = 0.5;
      opacityValue.textContent = '0.5';
      blurInput.value = 0;
      blurValue.textContent = '0px';
      brightnessInput.value = 100;
      brightnessValue.textContent = '100%';
      overlayColorInput.value = '#000000';
      overlayOpacityInput.value = 0;
      overlayOpacityValue.textContent = '0';
      previewImage.style.display = 'none';
      previewImage.src = '';
      
      // Reset preview
      updatePreview();
      
      // Send reset message to content script
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0] && (tabs[0].url.includes('twitter.com') || tabs[0].url.includes('x.com'))) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'resetBackground'
          });
        }
      });
      
      statusMsg.textContent = 'Background reset to default!';
      statusMsg.style.color = 'green';
    });
  }
  
  function initTabs() {
    const tabs = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', function() {
        // Remove active class from all tabs
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(t => t.classList.remove('active'));
        
        // Add active class to current tab
        tab.classList.add('active');
        
        // Show corresponding content
        const tabId = tab.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
      });
    });
  }
  
  function initThemeToggle() {
    themeSelector.addEventListener('change', function() {
      const theme = themeSelector.value;
      applyTheme(theme);
      
      // Save theme preference
      chrome.storage.local.set({ 'theme': theme });
    });
  }
  
  function applyTheme(theme) {
    document.body.className = theme;
  }
  
  function initPresets() {
    // Load saved presets
    chrome.storage.local.get('presets', function(result) {
      if (result.presets) {
        updatePresetSelector(result.presets);
      }
    });
  }
  
  function updatePresetSelector(presets) {
    // Clear existing options except the default one
    while (presetSelector.options.length > 1) {
      presetSelector.remove(1);
    }
    
    // Add preset options
    Object.keys(presets).forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      presetSelector.appendChild(option);
    });
  }
  
  function savePreset() {
    const presetName = prompt('Enter a name for this preset:');
    if (!presetName) return;
    
    let backgroundImage = imageUrlInput.value.trim();
    
    // If we have an uploaded file, use that instead of URL
    if (imageUploadInput.files.length > 0 || 
        (previewImage.src && previewImage.src !== window.location.href)) {
      backgroundImage = previewImage.src;
    }
    
    if (!backgroundImage) {
      statusMsg.textContent = 'Please provide an image before saving a preset.';
      return;
    }
    
    const preset = {
      backgroundImage: backgroundImage,
      opacity: opacityInput.value,
      blur: blurInput.value,
      brightness: brightnessInput.value,
      overlayColor: overlayColorInput.value,
      overlayOpacity: overlayOpacityInput.value
    };
    
    // Get existing presets or create new object
    chrome.storage.local.get('presets', function(result) {
      const presets = result.presets || {};
      presets[presetName] = preset;
      
      // Save updated presets
      chrome.storage.local.set({ 'presets': presets }, function() {
        statusMsg.textContent = `Preset "${presetName}" saved!`;
        statusMsg.style.color = 'green';
        updatePresetSelector(presets);
        
        // Select the new preset
        presetSelector.value = presetName;
      });
    });
  }
  
  function loadPreset() {
    const presetName = presetSelector.value;
    if (presetName === 'default') {
      return;
    }
    
    chrome.storage.local.get('presets', function(result) {
      if (!result.presets || !result.presets[presetName]) {
        statusMsg.textContent = 'Preset not found.';
        return;
      }
      
      const preset = result.presets[presetName];
      
      // Apply preset values
      previewImage.src = preset.backgroundImage;
      previewImage.style.display = 'block';
      
      if (!preset.backgroundImage.startsWith('data:')) {
        imageUrlInput.value = preset.backgroundImage;
      } else {
        imageUrlInput.value = '';
      }
      
      opacityInput.value = preset.opacity;
      opacityValue.textContent = preset.opacity;
      
      blurInput.value = preset.blur;
      blurValue.textContent = preset.blur + 'px';
      
      brightnessInput.value = preset.brightness;
      brightnessValue.textContent = preset.brightness + '%';
      
      overlayColorInput.value = preset.overlayColor;
      
      overlayOpacityInput.value = preset.overlayOpacity;
      overlayOpacityValue.textContent = preset.overlayOpacity;
      
      // Update preview
      updatePreview();
      
      statusMsg.textContent = `Preset "${presetName}" loaded!`;
      statusMsg.style.color = 'green';
    });
  }
  
  function deletePreset() {
    const presetName = presetSelector.value;
    if (presetName === 'default') {
      statusMsg.textContent = 'Cannot delete the default option.';
      return;
    }
    
    if (confirm(`Are you sure you want to delete the preset "${presetName}"?`)) {
      chrome.storage.local.get('presets', function(result) {
        if (!result.presets || !result.presets[presetName]) {
          statusMsg.textContent = 'Preset not found.';
          return;
        }
        
        // Remove preset
        delete result.presets[presetName];
        
        // Save updated presets
        chrome.storage.local.set({ 'presets': result.presets }, function() {
          statusMsg.textContent = `Preset "${presetName}" deleted!`;
          statusMsg.style.color = 'green';
          updatePresetSelector(result.presets);
          presetSelector.value = 'default';
        });
      });
    }
  }
  
  // Helper function to check if URL is valid
  function isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  }
});