Cypress.on('uncaught:exception', (err, runnable) => {
  return false;
});

describe('US-06: Pengujian Generate Leaflet Multi-Halaman', () => {
  beforeEach(() => {
    cy.visit('http://127.0.0.1:5173/login');
    cy.get('#username', { timeout: 20000 }).type('manager');
    cy.get('#password', { timeout: 20000 }).type('manager123');
    cy.get('button[type="submit"]', { timeout: 20000 }).click();
    
    cy.url({ timeout: 20000 }).should('not.include', '/login');
  });

  it('TC-01: Alur lengkap unggah Excel, pilih template, dan generate ke Editor', () => {
    cy.visit('http://127.0.0.1:5173/buat-leaflet');
    
    cy.get('input[type="file"]', { timeout: 25000 }).should('exist').selectFile('cypress/fixtures/dataset.xlsx', { force: true });
    cy.wait(2000);
    
    cy.contains('button', /Lanjut|Selanjutnya|Generate|Proses|Buat Leaflet/i, { timeout: 70000 }).click({ force: true });
    cy.url({ timeout: 40000 }).should('include', '/pilih-template');
    
    cy.intercept('POST', '**/api/leaflet/generate-draft*').as('generateDraft');
    
    cy.get('main img', { timeout: 30000 }).should('be.visible').first().click({ force: true });
    
    cy.wait('@generateDraft', { timeout: 300000 }).its('response.statusCode').should('eq', 200);
    
    cy.url({ timeout: 60000 }).should('include', '/editor');
  });
});