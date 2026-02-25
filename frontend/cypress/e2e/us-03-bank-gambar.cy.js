describe('US-03: Pengujian Fungsionalitas Bank Gambar', () => {
  beforeEach(() => {
    cy.visit('http://127.0.0.1:5173/login');
    cy.get('#username').type('manager'); 
    cy.get('#password').type('manager123'); 
    cy.get('button[type="submit"]').click();
    cy.visit('http://127.0.0.1:5173/bank-gambar');
  });

  it('TC-04: Berhasil membuka modal dan mengisi form tambah produk', () => {
    cy.contains('Tambah Produk').click();
    cy.get('input[name="plu_code"]').type('888999222');
    cy.get('input[name="name"]').type('Produk Dummy Cypress');
    cy.get('input[type="file"]').selectFile('cypress/fixtures/ddownload.jpg', { force: true });
    cy.get('input[name="plu_code"]').should('have.value', '888999222');
  });
});