<?php
namespace App\Mail;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
class AccountApprovedMail extends Mailable
{
    use Queueable, SerializesModels;
    public function __construct(public User $user) {}
    public function build() { return $this->subject('Akun DiServe Disetujui')->view('emails.account_approved'); }
}
