Cypress.on('uncaught:exception', (err, runnable) => {
  return false;
});

describe('US-03: Pengujian Fungsionalitas Bank Gambar', () => {
  beforeEach(() => {
    cy.visit('http://127.0.0.1:5173/login');
    cy.get('input[name="username"]').type('manager');
    cy.get('input[name="password"]').type('manager123');
    cy.get('button[type="submit"]').click();
    cy.visit('http://127.0.0.1:5173/bank-gambar');
  });

  it('TC-02: Menambah entri gambar produk baru', () => {
    cy.contains('Tambah Gambar').click();
    cy.get('input[name="plu_code"]').type('12345678');
    cy.get('input[name="name"]').type('Produk Sampo Uji');
    cy.get('input[type="file"]').selectFile('cypress/fixtures/sampo.jpg', { force: true });
    cy.get('button[type="submit"]').click();
    cy.contains('12345678').should('exist');
  });
});