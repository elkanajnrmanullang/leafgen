Cypress.on('uncaught:exception', (err, runnable) => {
  return false;
});

describe('US-08 & US-10: Pengujian History dan AI Smart Grid', () => {

  it('TC-01: US-10 - Membuka riwayat desain lama dari halaman History', () => {
    cy.visit('http://127.0.0.1:5173/login');
    cy.get('#username', { timeout: 60000 }).type('manager');
    cy.get('#password', { timeout: 60000 }).type('manager123');
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 60000 }).should('not.include', '/login');

    cy.visit('http://127.0.0.1:5173/history');
    cy.contains(/Riwayat|History|Daftar/i, { timeout: 60000 }).should('be.visible');
    cy.get('button').contains(/Buka|Edit|Lihat/i, { timeout: 60000 }).first().click({ force: true });

    cy.url({ timeout: 100000 }).should('include', '/editor');
  });

  it('TC-02: US-08 - Alur lengkap hingga Mengaktifkan Grid Cerdas (MALUKU)', () => {
    cy.visit('http://127.0.0.1:5173/login');
    cy.get('#username').type('manager');
    cy.get('#password').type('manager123');
    cy.intercept('POST', '**/api/login').as('loginReq');
    cy.get('button[type="submit"]').click();
    cy.wait('@loginReq');

    cy.visit('http://127.0.0.1:5173/buat-leaflet');
    cy.intercept('POST', '**/api/leaflet/check-regions*').as('checkRegions');
    cy.intercept('POST', '**/api/leaflet/generate-draft*').as('generateDraft');
    
    cy.get('input[type="file"]').selectFile('cypress/fixtures/dataset.xlsx', { force: true });
    cy.wait('@checkRegions', { timeout: 150000 });

    // Pilih region MALUKU
    cy.get('select', { timeout: 60000 }).should('be.visible').select('MALUKU');
    
    cy.wait(5000); 
    cy.url().then(($url) => {
      if ($url.includes('/buat-leaflet')) {
        cy.get('body').then(($body) => {
          if ($body.find('button:contains("Lanjut"), button:contains("Selanjutnya")').length > 0) {
            cy.contains('button', /Lanjut|Selanjutnya|Pilih Template/i).click({ force: true });
          }
        });
      }
    });

    cy.url({ timeout: 100000 }).then(($url) => {
      if ($url.includes('/pilih-template')) {
        cy.get('main img', { timeout: 80000 }).first().click({ force: true });
      }
    });

    cy.wait('@generateDraft', { timeout: 300000 });
    cy.url({ timeout: 120000 }).should('include', '/editor');

    cy.wait(30000); 
    cy.contains('button', /Unduh|Download|Ekspor/i, { timeout: 60000 }).should('be.visible');
    
    cy.get('input[type="checkbox"]', { timeout: 60000 })
      .should('exist')
      .check({ force: true });

    cy.get('input[type="checkbox"]').should('be.checked');
    
    cy.wait(10000); 
  });
});