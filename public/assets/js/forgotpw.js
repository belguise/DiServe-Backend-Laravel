document.addEventListener('DOMContentLoaded', function () {
    const forgotForm = document.getElementById('forgot-form');
    const successNotification = document.getElementById('success-notification');
    const forgotSubtitle = document.getElementById('forgot-subtitle');
    const emailGroup = document.getElementById('email-group');
    const submitBtn = document.getElementById('submit-forgot');
    const forgotError = document.getElementById('forgot-error');

    if (!forgotForm){
        return;
    }

    forgotForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const emailInput = document.getElementById('recovery-email').value.trim();
        
        forgotError.textContent = "";

        if (emailInput === '') {
            forgotError.textContent = "Email wajib diisi.";
            return;
        }

        const isValidDomain = emailInput.endsWith('@students.undip.ac.id') || 
                              emailInput.endsWith('@lectures.undip.ac.id') || 
                              emailInput.endsWith('@staff.undip.ac.id') ||
                              emailInput.endsWith('@officer.undip.ac.id') ||
                              emailInput.endsWith('@facility.undip.ac.id') ||
                              emailInput.endsWith('@admin.undip.ac.id');

        if (!isValidDomain) {
            forgotError.textContent = "Gunakan email resmi UNDIP yang valid.";
            return;
        }

        emailGroup.classList.add('hidden');
        submitBtn.classList.add('hidden');
        forgotForm.querySelector('.register-link').classList.add('hidden');
        forgotSubtitle.style.display = 'none';
        
        successNotification.classList.remove('hidden');
    });
});