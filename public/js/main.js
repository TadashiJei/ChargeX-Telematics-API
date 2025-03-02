/**
 * Main JavaScript for ChargeX Telematics
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize dropdown menus
  initDropdowns();
  
  // Initialize tooltips
  initTooltips();
  
  // Handle mobile menu toggle
  initMobileMenu();
});

/**
 * Initialize dropdown menus
 */
function initDropdowns() {
  const dropdowns = document.querySelectorAll('.dropdown-toggle');
  
  dropdowns.forEach(dropdown => {
    dropdown.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const menu = this.nextElementSibling;
      
      // Close all other dropdowns
      document.querySelectorAll('.dropdown-menu.show').forEach(openMenu => {
        if (openMenu !== menu) {
          openMenu.classList.remove('show');
        }
      });
      
      // Toggle this dropdown
      menu.classList.toggle('show');
    });
  });
  
  // Close dropdowns when clicking outside
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.dropdown-menu') && !e.target.classList.contains('dropdown-toggle')) {
      document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
        menu.classList.remove('show');
      });
    }
  });
}

/**
 * Initialize tooltips
 */
function initTooltips() {
  const tooltips = document.querySelectorAll('[data-tooltip]');
  
  tooltips.forEach(tooltip => {
    tooltip.addEventListener('mouseenter', function() {
      const text = this.getAttribute('data-tooltip');
      const tooltipEl = document.createElement('div');
      tooltipEl.classList.add('tooltip');
      tooltipEl.textContent = text;
      
      document.body.appendChild(tooltipEl);
      
      const rect = this.getBoundingClientRect();
      const tooltipRect = tooltipEl.getBoundingClientRect();
      
      tooltipEl.style.top = (rect.top - tooltipRect.height - 10) + 'px';
      tooltipEl.style.left = (rect.left + (rect.width / 2) - (tooltipRect.width / 2)) + 'px';
      tooltipEl.classList.add('show');
      
      this.addEventListener('mouseleave', function onMouseLeave() {
        tooltipEl.remove();
        this.removeEventListener('mouseleave', onMouseLeave);
      });
    });
  });
}

/**
 * Initialize mobile menu
 */
function initMobileMenu() {
  const menuToggle = document.querySelector('.mobile-menu-toggle');
  
  if (menuToggle) {
    menuToggle.addEventListener('click', function() {
      const nav = document.querySelector('.main-nav');
      nav.classList.toggle('show');
      this.classList.toggle('active');
    });
  }
}

/**
 * Format date to a readable string
 * @param {string|Date} date - Date to format
 * @param {boolean} includeTime - Whether to include time
 * @returns {string} Formatted date string
 */
function formatDate(date, includeTime = false) {
  if (!date) return 'N/A';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid Date';
  
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric'
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return d.toLocaleDateString('en-US', options);
}

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
function formatNumber(num) {
  if (num === null || num === undefined) return 'N/A';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format duration in days to a readable string
 * @param {number} days - Number of days
 * @returns {string} Formatted duration
 */
function formatDuration(days) {
  if (days === null || days === undefined) return 'N/A';
  
  if (days < 30) {
    return days + ' days';
  } else if (days < 365) {
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    return months + ' month' + (months > 1 ? 's' : '') + 
           (remainingDays > 0 ? ', ' + remainingDays + ' day' + (remainingDays > 1 ? 's' : '') : '');
  } else {
    const years = Math.floor(days / 365);
    const remainingDays = days % 365;
    const months = Math.floor(remainingDays / 30);
    
    let result = years + ' year' + (years > 1 ? 's' : '');
    
    if (months > 0) {
      result += ', ' + months + ' month' + (months > 1 ? 's' : '');
    }
    
    return result;
  }
}

// Export utility functions for use in other modules
window.formatDate = formatDate;
window.formatNumber = formatNumber;
window.formatDuration = formatDuration;
