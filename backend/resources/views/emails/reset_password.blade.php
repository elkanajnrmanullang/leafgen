<!DOCTYPE html>
<html>
<head>
    <title>Reset Password</title>
    <style>
        body { font-family: Arial, sans-weight; line-height: 1.6; color: #333; background-color: #f8fafc; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .header { text-align: center; margin-bottom: 30px; }
        .header h2 { color: #1e293b; margin: 0; }
        .btn { display: inline-block; background-color: #4f46e5; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .footer { margin-top: 30px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>LeafGenn System</h2>
        </div>
        
        <p>Halo, <strong>{{ $userName }}</strong>,</p>
        
        <p>Kami menerima permintaan untuk mereset kata sandi akun Anda di aplikasi LeafGenn. Jika Anda memang melakukan permintaan ini, silakan klik tombol di bawah ini untuk membuat kata sandi baru:</p>
        
        <div style="text-align: center;">
            <a href="{{ $resetUrl }}" class="btn">Reset Kata Sandi</a>
        </div>
        
        <p>Tautan reset kata sandi ini akan kedaluwarsa dalam <strong>60 menit</strong>.</p>
        
        <p>Jika Anda tidak pernah meminta reset kata sandi, abaikan email ini. Akun Anda tetap aman.</p>
        
        <div class="footer">
            <p>&copy; {{ date('Y') }} LeafGenn System. Hak cipta dilindungi undang-undang.</p>
            <p>Jika Anda kesulitan mengklik tombol, salin URL berikut ke browser Anda: <br><a href="{{ $resetUrl }}" style="color: #4f46e5; word-break: break-all;">{{ $resetUrl }}</a></p>
        </div>
    </div>
</body>
</html>