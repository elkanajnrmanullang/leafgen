Cypress.on('uncaught:exception', (err, runnable) => {
  return false;
});

describe('US-02: Pengujian Manajemen Akun Pengguna', () => {
  beforeEach(() => {
    cy.visit('http://127.0.0.1:5173/login');
    cy.get('#username', { timeout: 15000 }).type('manager');
    cy.get('#password').type('manager123');
    cy.get('button[type="submit"]').click();
    
    cy.url({ timeout: 15000 }).should('not.include', '/login');
    cy.visit('http://127.0.0.1:5173/manajemen-akun');
  });

  it('TC-01: Memastikan halaman dapat diakses oleh Manajer', () => {
    
    cy.contains(/Manajemen Akun|Daftar Pengguna|Akun/i, { timeout: 15000 }).should('exist');
  });

  it('TC-02: Menambahkan staf desain baru', () => {
    cy.contains('button', /Tambah|User Baru|Akun Baru/i, { timeout: 15000 }).click({ force: true });
    
    cy.wait(1000);
    
    cy.get('input[name="name"], input#name').clear().type('Ini Budi');
    cy.get('input[name="email"], input#email, input[type="email"]').clear().type('budi@gmail.com');
    cy.get('input[name="username"], input#username').clear().type('budi');
    
    cy.get('select').select('staff');
    
    cy.contains('button', /Simpan|Tambah|Submit/i).click({ force: true });
    
    cy.contains('Ini Budi', { timeout: 20000 }).should('exist');
  });
});