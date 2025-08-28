// Ganti URL ini dengan URL CSV publikasi dari Google Sheets Anda
const URL_NILAI = https://docs.google.com/spreadsheets/d/e/2PACX-1vSLRAyik2jDPRzl0lotNzPLsp4MCDPbC3qREDZ2JiW8TlxcJz_ruO7cDzU80EFvtfI0eJxo3mJjuvAm/pub?gid=0&single=true&output=csv;
const URL_PEGAWAI = https://docs.google.com/spreadsheets/d/e/2PACX-1vSLRAyik2jDPRzl0lotNzPLsp4MCDPbC3qREDZ2JiW8TlxcJz_ruO7cDzU80EFvtfI0eJxo3mJjuvAm/pub?gid=771208512&single=true&output=csv;
const URL_RATING = https://script.google.com/macros/s/AKfycbwR1xztxP9wtwFDBDgwKhvyQkTYs66cDGrcqwhEb4bTBFAb-KJyja1P4DTdQ0_o6Bbs0w/exec;

let currentCardIndex = 0;
let nilaiData = [];
let pegawaiData = [];

const cardContainer = document.getElementById('card-container');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const ratingSection = document.getElementById('rating-section');
const ratingForm = document.getElementById('rating-form');
const submitBtn = document.getElementById('submit-rating-btn');

function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(header => header.trim());
    return lines.slice(1).map(line => {
        const data = line.split(',');
        const obj = {};
        headers.forEach((header, i) => {
            obj[header] = data[i].trim();
        });
        return obj;
    });
}

async function fetchData() {
    try {
        const responseNilai = await fetch(URL_NILAI);
        const csvNilai = await responseNilai.text();
        nilaiData = parseCSV(csvNilai);

        const responsePegawai = await fetch(URL_PEGAWAI);
        const csvPegawai = await responsePegawai.text();
        pegawaiData = parseCSV(csvPegawai);

        renderCards();
    } catch (error) {
        console.error("Gagal mengambil data:", error);
        cardContainer.innerHTML = "<p>Gagal memuat konten. Silakan periksa kembali URL Google Sheets Anda.</p>";
    }
}

function renderCards() {
    cardContainer.innerHTML = '';
    nilaiData.forEach((nilai, index) => {
        const card = document.createElement('div');
        card.className = 'ethics-card';
        card.id = `card-${index}`;
        if (index === currentCardIndex) {
            card.classList.add('active');
        }
        
        const warna_heks = nilai['Warna Hex'] || '#00A551';
        const gambar_url = nilai['Supergrafis'] || '';
        const nama_nilai = nilai['Nilai'] || '';
        const deskripsi = nilai['Deskripsi'] || '';

        card.style.backgroundColor = warna_heks;

        const supergraphic = document.createElement('div');
        supergraphic.className = 'supergraphic-overlay';
        if (gambar_url) {
            supergraphic.style.backgroundImage = `url(${gambar_url})`;
        }

        card.innerHTML = `
            <h3 class="card-title">${nama_nilai}</h3>
            <p class="card-description">${deskripsi}</p>
        `;
        card.appendChild(supergraphic);
        cardContainer.appendChild(card);
    });
    updateButtonStates();
}

function updateButtonStates() {
    prevBtn.disabled = currentCardIndex === 0;
    
    if (currentCardIndex === nilaiData.length - 1) {
        nextBtn.textContent = 'Mulai Rating';
    } else {
        nextBtn.textContent = 'Selanjutnya';
    }
}

function renderRatingSection() {
    cardContainer.style.display = 'none';
    prevBtn.style.display = 'none';
    nextBtn.style.display = 'none';
    ratingSection.style.display = 'block';
    
    ratingForm.innerHTML = '';
    pegawaiData.forEach(pegawai => {
        const pegawaiBlock = document.createElement('div');
        pegawaiBlock.className = 'pegawai-rating-block';
        
        const nama_pegawai = pegawai['Nama'];
        const id_pegawai = pegawai['ID Pegawai'];
        
        pegawaiBlock.innerHTML = `<h3 data-id="${id_pegawai}">${nama_pegawai}</h3>`;

        nilaiData.forEach(nilai => {
            const ratingInput = document.createElement('div');
            ratingInput.className = 'rating-stars';
            
            ratingInput.dataset.pegawaiId = id_pegawai;
            ratingInput.dataset.nilai = nilai['Nilai'];
            ratingInput.innerHTML = `<span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span>`;
            
            ratingInput.querySelectorAll('span').forEach((star, starIndex) => {
                star.addEventListener('click', () => {
                    ratingInput.querySelectorAll('span').forEach((s, sIndex) => {
                        s.classList.toggle('filled', sIndex <= starIndex);
                    });
                    
                    ratingInput.dataset.ratingValue = starIndex + 1;
                });
            });
            
            pegawaiBlock.appendChild(ratingInput);
        });

        ratingForm.appendChild(pegawaiBlock);
    });
}

nextBtn.addEventListener('click', () => {
    if (currentCardIndex < nilaiData.length - 1) {
        currentCardIndex++;
        renderCards();
    } else {
        renderRatingSection();
    }
});

prevBtn.addEventListener('click', () => {
    if (currentCardIndex > 0) {
        currentCardIndex--;
        renderCards();
    }
});

submitBtn.addEventListener('click', async (event) => {
    event.preventDefault();

    const allRatings = [];
    const ratingBlocks = document.querySelectorAll('.pegawai-rating-block');

    ratingBlocks.forEach(block => {
        const id_pegawai = block.querySelector('h3').dataset.id;
        const ratingInputs = block.querySelectorAll('.rating-stars');
        
        ratingInputs.forEach(input => {
            const nilai_berakhlak = input.dataset.nilai;
            const bintang = input.dataset.ratingValue || 0;
            
            if (bintang > 0) {
                allRatings.push({
                    id_pegawai: id_pegawai,
                    nilai_berakhlak: nilai_berakhlak,
                    bintang: parseInt(bintang)
                });
            }
        });
    });

    if (allRatings.length > 0) {
        try {
            const response = await fetch(URL_RATING, {
                method: 'POST',
                body: JSON.stringify(allRatings),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                alert('Rating berhasil dikirim! Leaderboard akan terakumulasi.');
                window.location.reload();
            } else {
                alert('Gagal mengirim rating. Silakan coba lagi.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Terjadi kesalahan. Silakan coba lagi.');
        }
    } else {
        alert('Silakan berikan setidaknya satu rating sebelum mengirim.');
    }
});

fetchData();
