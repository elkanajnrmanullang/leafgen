describe('US-04: Pengujian Injeksi Dataset Promosi', () => {
  beforeEach(() => {
    cy.visit('http://127.0.0.1:5173/login');
    cy.get('input[name="username"]').type('manager');
    cy.get('input[name="password"]').type('manager123');
    cy.get('button[type="submit"]').click();
    cy.visit('http://127.0.0.1:5173/buat-leaflet');
  });

  it('TC-03: Mengunggah fail dataset ekstensi .xlsx', () => {
    cy.get('input[type="file"]').selectFile('cypress/fixtures/dataset.xlsx', { force: true });
    cy.contains('Selanjutnya').click();
    cy.url().should('include', '/pilih-template');
  });
});