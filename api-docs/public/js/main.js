document.addEventListener('DOMContentLoaded', function() {
  // Sidebar toggle functionality
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebar = document.querySelector('.sidebar');
  const content = document.querySelector('.content');
  
  if (sidebarToggle && sidebar && content) {
    sidebarToggle.addEventListener('click', function() {
      sidebar.classList.toggle('collapsed');
      content.classList.toggle('expanded');
    });
  }
  
  // Initialize Swagger UI
  const ui = SwaggerUIBundle({
    url: "swagger.json",
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIBundle.SwaggerUIStandalonePreset
    ],
    layout: "BaseLayout",
    docExpansion: "list",
    defaultModelsExpandDepth: 1,
    defaultModelExpandDepth: 1,
    tagsSorter: "alpha",
    operationsSorter: "alpha",
    syntaxHighlight: {
      activate: true,
      theme: "agate"
    },
    filter: true,
    persistAuthorization: true,
    displayRequestDuration: true,
    tryItOutEnabled: true,
    requestSnippetsEnabled: true,
    requestInterceptor: (request) => {
      // Add any request interceptors here if needed
      return request;
    },
    responseInterceptor: (response) => {
      // Add any response interceptors here if needed
      return response;
    },
    onComplete: function() {
      // Custom actions after Swagger UI loads
      customizeSwaggerUI();
    }
  });

  window.ui = ui;

  // Sidebar navigation
  const sidebarLinks = document.querySelectorAll('.sidebar-menu a');
  sidebarLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      // Remove active class from all links
      sidebarLinks.forEach(l => l.classList.remove('active'));
      // Add active class to clicked link
      this.classList.add('active');
      
      // If the link is for a section in the page, scroll to it
      const targetId = this.getAttribute('href');
      if (targetId.startsWith('#')) {
        e.preventDefault();
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          window.scrollTo({
            top: targetElement.offsetTop - 80,
            behavior: 'smooth'
          });
        }
      }
    });
  });

  // Customize Swagger UI appearance
  function customizeSwaggerUI() {
    // Apply ChargeX theme colors to Swagger UI elements
    const swaggerUIContainer = document.querySelector('.swagger-ui');
    if (swaggerUIContainer) {
      // Add custom class to the Swagger UI container
      swaggerUIContainer.classList.add('chargex-theme');
      
      // Customize operation blocks
      const opBlocks = document.querySelectorAll('.opblock');
      opBlocks.forEach(block => {
        // Add custom hover effect
        block.addEventListener('mouseenter', function() {
          this.style.boxShadow = '0 4px 8px rgba(247, 138, 29, 0.1)';
        });
        block.addEventListener('mouseleave', function() {
          this.style.boxShadow = '';
        });
      });
      
      // Customize try-it-out buttons
      const tryButtons = document.querySelectorAll('.try-out__btn');
      tryButtons.forEach(button => {
        button.style.backgroundColor = '#f78a1d';
        button.style.color = 'white';
        button.addEventListener('mouseenter', function() {
          this.style.backgroundColor = '#e67300';
        });
        button.addEventListener('mouseleave', function() {
          this.style.backgroundColor = '#f78a1d';
        });
      });
      
      // Customize execute buttons
      const executeButtons = document.querySelectorAll('.execute');
      executeButtons.forEach(button => {
        button.style.backgroundColor = '#f78a1d';
        button.addEventListener('mouseenter', function() {
          this.style.backgroundColor = '#e67300';
        });
        button.addEventListener('mouseleave', function() {
          this.style.backgroundColor = '#f78a1d';
        });
      });
    }
  }
  
  // Add smooth scrolling for all anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      
      // Skip if it's a sidebar link (already handled above)
      if (this.closest('.sidebar-menu')) {
        return;
      }
      if (targetId !== '#') {
        e.preventDefault();
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          window.scrollTo({
            top: targetElement.offsetTop - 80,
            behavior: 'smooth'
          });
        }
      }
    });
  });
});
