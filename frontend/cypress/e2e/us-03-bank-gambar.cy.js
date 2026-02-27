Cypress.on('uncaught:exception', (err, runnable) => {
  return false;
});

describe('US-03: Pengujian Fungsionalitas Bank Gambar', () => {
  beforeEach(() => {
    cy.visit('http://127.0.0.1:5173/login');
    cy.get('#username').type('manager');
    cy.get('#password').type('manager123');
    cy.get('button[type="submit"]').click();
    
    // Menunggu proses login selesai
    cy.url().should('not.include', '/login');
    cy.visit('http://127.0.0.1:5173/bank-gambar');
  });

  it('TC-02: Menambah entri gambar produk baru', () => {
    cy.contains(/Tambah|Upload/i).click(); 
    
    cy.wait(500);
    
    cy.get('input[type="text"]').eq(1).clear().type('123123123');
    
    cy.get('input[type="text"]').eq(2).clear().type('Minyak Goreng');
    
    cy.get('input[type="file"]').selectFile('cypress/fixtures/ddownload.jpg', { force: true });
    
    cy.contains('button', /Simpan|Upload|Tambah/i).click();
    
    cy.contains('123123123', { timeout: 10000 }).should('exist');
  });
});