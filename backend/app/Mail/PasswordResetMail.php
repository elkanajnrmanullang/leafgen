<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PasswordResetMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $token
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Reset Password Akun LeafGenn Anda',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.password_reset',
        );
    }
}
