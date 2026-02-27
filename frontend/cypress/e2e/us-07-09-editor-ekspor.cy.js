Cypress.on('uncaught:exception', (err, runnable) => {
  return false;
});

describe('US-07 & US-09: Editor Visual dan Ekspor Leaflet', () => {
  it('TC-01: Alur penuh dari Login, Upload, Pilih Region, Manipulasi, hingga Unduh PDF', () => {
    cy.visit('http://127.0.0.1:5173/login');
    cy.get('#username', { timeout: 80000 }).clear().type('manager').should('have.value', 'manager');
    cy.get('#password', { timeout: 80000 }).clear().type('manager123').should('have.value', 'manager123');
    
    cy.intercept('POST', '**/api/login').as('loginReq');
    cy.get('button[type="submit"]', { timeout: 80000 }).click({ force: true });
    
    cy.wait('@loginReq', { timeout: 100000 });
    cy.url({ timeout: 80000 }).should('not.include', '/login');

    cy.visit('http://127.0.0.1:5173/buat-leaflet');
    cy.intercept('POST', '**/api/leaflet/check-regions*').as('checkRegions');
    cy.intercept('POST', '**/api/leaflet/generate-draft*').as('generateDraft');
    
    cy.get('input[type="file"]', { timeout: 100000 }).should('exist').selectFile('cypress/fixtures/dataset.xlsx', { force: true });

    cy.wait('@checkRegions', { timeout: 150000 });

    cy.get('select', { timeout: 80000 }).should('be.visible').select('JAWA');
    cy.wait(5000); 

    cy.contains('button', /Lanjut|Selanjutnya|Pilih Template/i, { timeout: 80000 })
      .should('be.visible')
      .click({ force: true });

    cy.url({ timeout: 120000 }).should('include', '/pilih-template');
    cy.get('main img', { timeout: 100000 }).should('be.visible').first().click({ force: true });

    cy.wait('@generateDraft', { timeout: 300000 }).its('response.statusCode').should('eq', 200);
    cy.url({ timeout: 120000 }).should('include', '/editor');

    cy.wait(30000);

    cy.get('main', { timeout: 100000 }).find('div[style*="absolute"]', { timeout: 100000 }).first().click({ force: true });
    
    cy.contains(/Properti|Pengaturan|Edit|Teks/i, { timeout: 100000 }).should('be.visible');
    cy.contains(/Promo|IGR|SPI|Badge/i, { timeout: 100000 }).should('be.visible').click({ force: true });

    cy.wait(8000); 

    cy.contains('button', /Refresh/i, { timeout: 120000 }).should('be.visible').click({ force: true });

    cy.wait(25000); 
    cy.contains('button', /Unduh|Download|Ekspor/i, { timeout: 100000 }).click({ force: true });
    
    cy.wait(3000);

    cy.contains(/PDF/i, { timeout: 100000 }).should('be.visible').click({ force: true });
    
    cy.get('button').contains(/Download|Simpan|Konfirmasi|Proses/i, { timeout: 100000 }).click({ force: true });
    
    cy.contains(/Menyiapkan|Memproses|Persiapan/i, { timeout: 120000 }).should('be.visible');
    
    cy.wait(80000);
  });
});