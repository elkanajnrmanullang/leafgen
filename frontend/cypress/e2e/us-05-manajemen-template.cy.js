Cypress.on('uncaught:exception', (err, runnable) => {
  return false;
});

describe('US-05: Pengujian Manajemen Template', () => {
  beforeEach(() => {
    cy.visit('http://127.0.0.1:5173/login');
    cy.get('#username', { timeout: 20000 }).type('manager');
    cy.get('#password', { timeout: 20000 }).type('manager123');
    cy.get('button[type="submit"]', { timeout: 20000 }).click();
    
    cy.url({ timeout: 20000 }).should('not.include', '/login');
    cy.visit('http://127.0.0.1:5173/manajemen-template');
  });

  it('TC-01: Mengunggah template latar belakang baru', () => {
    cy.contains(/Tambah|Upload/i, { timeout: 25000 }).click(); 
    
    cy.wait(1000);

    cy.get('input[type="text"]', { timeout: 25000 }).last().clear().type('Template Spesial Promo');
    
    cy.get('input[type="file"]', { timeout: 20000 }).selectFile('cypress/fixtures/ddownload.jpg', { force: true });
    
    cy.wait(1000);
    
    cy.contains('button', /Simpan|Upload|Tambah/i, { timeout: 20000 }).click({ force: true });
    
    cy.contains('Template Spesial Promo', { timeout: 35000 }).should('exist');
  });
});