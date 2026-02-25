describe('US-01: Pengujian Fungsionalitas Autentikasi', () => {
  beforeEach(() => {
    cy.visit('http://127.0.0.1:5173/login');
  });

  it('TC-01: Gagal login jika menggunakan kata sandi yang salah', () => {
    cy.get('#username').type('manager'); 
    cy.get('#password').type('salahpassword123');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/login');
  });

  it('TC-02: Berhasil login dan diarahkan ke Dashboard', () => {
    cy.intercept('POST', 'http://127.0.0.1:8000/api/login').as('loginRequest');
    cy.get('#username').type('manager');
    cy.get('#password').type('manager123'); 
    cy.get('button[type="submit"]').click();
    cy.wait('@loginRequest').then((interception) => {
      expect(interception.response.statusCode).to.eq(200); 
    });
    cy.url().should('not.include', '/login');
  });

  it('TC-03: Navigasi ke reset password menggunakan konfirmasi email', () => {
    cy.contains('Lupa Password?').click(); 
    cy.get('#email').type('manager@perusahaanx.com'); 
    cy.get('button[type="submit"]').click();
  });
});