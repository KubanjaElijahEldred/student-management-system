// Background Customization System

// Apply custom wallpaper to dashboard
window.applyCustomWallpaper = function() {
  const input = document.getElementById('wallpaperInput');
  const file = input.files[0];
  
  if (!file) {
    alert('⚠️ Please select an image file first');
    return;
  }
  
  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert('❌ File too large! Please choose an image under 5MB');
    return;
  }
  
  const reader = new FileReader();
  
  reader.onload = function(e) {
    const imageData = e.target.result;
    
    // Save to localStorage
    try {
      localStorage.setItem('customDashboardBg', imageData);
      localStorage.setItem('bgType', 'wallpaper');
      
      // Apply immediately
      applyStoredBackground();
      
      alert('✅ Wallpaper applied successfully!');
      updateCurrentSettings();
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        alert('❌ Image too large for storage! Try a smaller image.');
      } else {
        alert('❌ Failed to save wallpaper: ' + error.message);
      }
    }
  };
  
  reader.onerror = function() {
    alert('❌ Failed to read the image file');
  };
  
  reader.readAsDataURL(file);
};

// Apply background color
window.applyBackgroundColor = function() {
  const colorPicker = document.getElementById('bgColorPicker');
  const color = colorPicker.value;
  
  // Save to localStorage
  localStorage.setItem('customBgColor', color);
  localStorage.setItem('bgType', 'color');
  
  // Apply immediately
  applyStoredBackground();
  
  alert('✅ Background color applied!');
  updateCurrentSettings();
};

// Reset to default background
window.resetBackground = function() {
  if (confirm('🔄 Reset background to default?')) {
    localStorage.removeItem('customDashboardBg');
    localStorage.removeItem('customBgColor');
    localStorage.removeItem('bgType');
    
    // Reset to default
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
      mainContent.style.background = '';
      mainContent.style.backgroundImage = '';
    }
    
    alert('✅ Background reset to default!');
    updateCurrentSettings();
  }
};

// Apply stored background on page load
function applyStoredBackground() {
  const bgType = localStorage.getItem('bgType');
  const mainContent = document.getElementById('mainContent');
  
  if (!mainContent) return;
  
  if (bgType === 'wallpaper') {
    const wallpaper = localStorage.getItem('customDashboardBg');
    if (wallpaper) {
      mainContent.style.backgroundImage = `url('${wallpaper}')`;
      mainContent.style.backgroundSize = 'cover';
      mainContent.style.backgroundPosition = 'center';
      mainContent.style.backgroundRepeat = 'no-repeat';
      mainContent.style.backgroundAttachment = 'fixed';
      console.log('✅ Custom wallpaper applied');
    }
  } else if (bgType === 'color') {
    const color = localStorage.getItem('customBgColor');
    if (color) {
      mainContent.style.backgroundImage = 'none';
      mainContent.style.background = color;
      console.log('✅ Custom background color applied:', color);
    }
  }
}

// Update current settings display
function updateCurrentSettings() {
  const settingsDisplay = document.getElementById('currentBgSettings');
  const bgType = localStorage.getItem('bgType');
  
  if (!settingsDisplay) return;
  
  let displayText = 'Background: ';
  
  if (bgType === 'wallpaper') {
    displayText += 'Custom Wallpaper 📷';
  } else if (bgType === 'color') {
    const color = localStorage.getItem('customBgColor');
    displayText += `Custom Color ${color} 🎨`;
  } else {
    displayText += 'Default';
  }
  
  settingsDisplay.textContent = displayText;
}

// LOGIN PAGE CUSTOMIZATION

// Apply custom wallpaper to login page
window.applyLoginWallpaper = function() {
  const input = document.getElementById('loginWallpaperInput');
  const file = input.files[0];
  
  if (!file) {
    alert('⚠️ Please select an image file first');
    return;
  }
  
  if (file.size > 5 * 1024 * 1024) {
    alert('❌ File too large! Please choose an image under 5MB');
    return;
  }
  
  const reader = new FileReader();
  
  reader.onload = function(e) {
    const imageData = e.target.result;
    
    try {
      localStorage.setItem('customLoginBg', imageData);
      applyStoredLoginBackground();
      alert('✅ Login wallpaper applied! Logout to see the change.');
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        alert('❌ Image too large for storage! Try a smaller image.');
      } else {
        alert('❌ Failed to save wallpaper: ' + error.message);
      }
    }
  };
  
  reader.readAsDataURL(file);
};

// Reset login background
window.resetLoginBackground = function() {
  if (confirm('🔄 Reset login background to default?')) {
    localStorage.removeItem('customLoginBg');
    applyStoredLoginBackground();
    alert('✅ Login background reset! Logout to see the change.');
  }
};

// Apply stored login background
function applyStoredLoginBackground() {
  const authContainer = document.querySelector('.auth-page-container');
  const customBg = localStorage.getItem('customLoginBg');
  
  if (!authContainer) return;
  
  if (customBg) {
    authContainer.style.backgroundImage = `url('${customBg}')`;
    authContainer.style.backgroundSize = 'cover';
    authContainer.style.backgroundPosition = 'center';
    console.log('✅ Custom login wallpaper applied');
  } else {
    // Reset to default desk background
    authContainer.style.backgroundImage = "url('https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1920&q=80')";
    console.log('✅ Default login background restored');
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎨 Customization system loaded');
  
  // Apply stored backgrounds
  setTimeout(() => {
    applyStoredBackground();
    applyStoredLoginBackground();
    updateCurrentSettings();
  }, 1000);
  
  // Update settings display when navigating to settings page
  const settingsNav = document.querySelector('.nav-item[data-page="settings"]');
  if (settingsNav) {
    settingsNav.addEventListener('click', () => {
      setTimeout(updateCurrentSettings, 100);
    });
  }
});

console.log('🎨 Customization module loaded');
