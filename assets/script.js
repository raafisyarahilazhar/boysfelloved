document.addEventListener('DOMContentLoaded', () => {
    // 1. Efek Navbar transparan ke solid saat scroll
    const navbar = document.getElementById('navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('nav-scrolled');
            // Menyesuaikan padding saat di-scroll
            navbar.querySelector('.h-20').classList.replace('h-20', 'h-16');
        } else {
            navbar.classList.remove('nav-scrolled');
            navbar.querySelector('.h-16')?.classList.replace('h-16', 'h-20');
        }
    });

    // 2. Simple Lightbox untuk Galeri
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImg');
    const closeBtn = document.getElementById('closeModal');
    const images = document.querySelectorAll('.img-trigger');

    // Buka gambar saat diklik
    images.forEach(img => {
        img.addEventListener('click', function() {
            modal.classList.remove('hidden');
            modalImg.src = this.src;
            document.body.style.overflow = 'hidden'; // cegah scroll background
        });
    });

    // Tutup gambar
    closeBtn.addEventListener('click', closeModal);
    
    // Tutup kalau klik di luar gambar
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    function closeModal() {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto'; // kembalikan scroll
    }
});