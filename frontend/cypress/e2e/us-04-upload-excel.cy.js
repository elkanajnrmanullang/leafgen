describe('US-04: Pengujian Integrasi Data Excel', () => {
  beforeEach(() => {
    cy.visit('http://127.0.0.1:5173/login');
    cy.get('#username').type('manager'); 
    cy.get('#password').type('manager123'); 
    cy.get('button[type="submit"]').click();
    cy.visit('http://127.0.0.1:5173/buat-leaflet');
  });

  it('TC-05: Merespon saat file Excel dipilih untuk diunggah', () => {
    cy.get('input[type="file"]').selectFile('cypress/fixtures/dataset.xlsx', { force: true });
    cy.contains('dataset.xlsx').should('exist'); 
  });
});