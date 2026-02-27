Cypress.on('uncaught:exception', (err, runnable) => {
  return false;
});

describe('US-04: Pengujian Injeksi Dataset Promosi', () => {
  beforeEach(() => {
    cy.visit('http://127.0.0.1:5173/login');
    cy.get('#username').type('manager');
    cy.get('#password').type('manager123');
    cy.get('button[type="submit"]').click();
    
    cy.url().should('not.include', '/login');
    cy.visit('http://127.0.0.1:5173/buat-leaflet');
  });

  it('TC-03: Mengunggah fail dataset ekstensi .xlsx', () => {
    cy.get('input[type="file"]').should('exist').selectFile('cypress/fixtures/dataset.xlsx', { force: true });
    
    cy.get('button').contains(/Lanjut|Selanjutnya|Generate|Proses|Buat|Pilih Template/i).click();
    
    cy.url({ timeout: 15000 }).should('include', '/pilih-template');
  });
});