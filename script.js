// =======================================================
// 1. CONSTANTES, VARIÁVEIS GLOBAIS E SELETORES DE DOM
// =======================================================

// --- Configuração da API ---
const API_KEY = "db062eef61bbade8e68dc0439adeafb4";
const BASE_URL = "https://api.themoviedb.org/3";
const IMGPATH = "https://image.tmdb.org/t/p/w1280";
const POPULAR_URL = `${BASE_URL}/discover/movie?sort_by=popularity.desc&api_key=${API_KEY}&language=pt-BR`;
const MOVIE_DETAILS_URL = `${BASE_URL}/movie/{id}?api_key=${API_KEY}&language=pt-BR`;
const MOVIE_VIDEOS_URL = `${BASE_URL}/movie/{id}/videos?api_key=${API_KEY}&language=pt-BR`;

// --- Seletores do DOM ---
const main = document.querySelector("main");
const form = document.querySelector("form");
const search = document.querySelector(".search");
const homeBtn = document.getElementById("home-btn");
const loadingSpinner = document.getElementById("loading-spinner");

// Seletores da Paginação
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const currentPageSpan = document.getElementById("current-page");

// Seletores do Modal
const movieDetailsModal = document.getElementById("movie-details-modal");
const closeModalBtn = document.querySelector(".close-modal-btn");
const modalBody = document.getElementById("modal-body");

// --- Estado da Aplicação ---
let currentPage = 1;
let currentUrl = ""; // Armazena a URL atual para a paginação funcionar na busca

// =======================================================
// 2. FUNÇÕES PRINCIPAIS (API & LÓGICA)
// =======================================================

async function getMovies(url) {
    showSpinner();
    try {
        const resp = await fetch(url);
        const respData = await resp.json();
        showMovies(respData.results);
        updatePagination();
    } catch (error) {
        console.error("Erro ao buscar os filmes:", error);
        main.innerHTML = `<h2 class="error-message">Não foi possível carregar os filmes. Tente novamente mais tarde.</h2>`;
    } finally {
        hideSpinner();
    }
}

async function getMovieDetails(movieId) {
    showSpinner();
    try {
        const detailsResp = await fetch(MOVIE_DETAILS_URL.replace("{id}", movieId));
        const detailsData = await detailsResp.json();

        const videosResp = await fetch(MOVIE_VIDEOS_URL.replace("{id}", movieId));
        const videosData = await videosResp.json();

        displayMovieDetails(detailsData, videosData);
        movieDetailsModal.classList.remove("hidden");
        document.body.style.overflow = "hidden";
    } catch (error) {
        console.error("Erro ao buscar detalhes do filme:", error);
    } finally {
        hideSpinner();
    }
}

// =======================================================
// 3. FUNÇÕES DE MANIPULAÇÃO DO DOM (EXIBIÇÃO)
// =======================================================

function showMovies(movies) {
    main.innerHTML = "";
    if (movies.length === 0) {
        main.innerHTML = `<h2 class="info-message">Nenhum filme encontrado.</h2>`;
        nextBtn.disabled = true;
        return;
    }

    nextBtn.disabled = false;
    movies.forEach((movie) => {
        if (!movie.poster_path) return;

        const { id, title, poster_path, vote_average, overview } = movie;
        const movieEl = document.createElement("div");
        movieEl.classList.add("movie");
        movieEl.innerHTML = `
            <img src="${IMGPATH + poster_path}" alt="${title}" />
            <div class="movie-info">
                <h3>${title}</h3>
                <span class="${getClassByRate(vote_average)}">${vote_average.toFixed(1)}</span>
            </div>
            <div class="overview">
                <h2>Sinopse:</h2>
                ${overview}
            </div>
        `;
        movieEl.addEventListener("click", () => getMovieDetails(id));
        main.appendChild(movieEl);
    });
}

function displayMovieDetails(movieDetails, videosData) {
    const genres = movieDetails.genres && movieDetails.genres.length > 0
        ? movieDetails.genres.map(g => g.name).join(', ')
        : 'Gênero não informado';

    const releaseDate = movieDetails.release_date
        ? new Date(movieDetails.release_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
        : 'Data não informada';

    const trailer = videosData?.results?.find(video => video.type === "Trailer" && video.site === "YouTube");

    modalBody.innerHTML = `
        <img src="${movieDetails.poster_path ? IMGPATH + movieDetails.poster_path : ''}" alt="${movieDetails.title}" class="modal-poster">
        <div class="modal-text-content">
            <h2 class="modal-title">${movieDetails.title || 'Título não disponível'}</h2>
            <p class="modal-overview">${movieDetails.overview || 'Sinopse não disponível.'}</p>
            <div class="modal-info">
                <p><strong>Lançamento:</strong> <span>${releaseDate}</span></p>
                <p><strong>Nota:</strong> <span>${movieDetails.vote_average ? movieDetails.vote_average.toFixed(1) : 'N/A'}</span></p>
                <p><strong>Gêneros:</strong> <span>${genres}</span></p>
                <p><strong>Duração:</strong> <span>${movieDetails.runtime ? movieDetails.runtime + ' minutos' : 'N/A'}</span></p>
            </div>
            <div id="modal-trailer-container">
                ${trailer ? `
                    <h3>Trailer</h3>
                    <iframe src="https://www.youtube.com/embed/${trailer.key}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                ` : '<p>Nenhum trailer encontrado.</p>'}
            </div>
        </div>
    `;
}

function getClassByRate(vote) {
    if (vote >= 8) return "green";
    if (vote >= 5) return "orange";
    return "red";
}

function updatePagination() {
    currentPageSpan.innerText = currentPage;
    prevBtn.disabled = currentPage <= 1;
}

function showSpinner() {
    loadingSpinner.classList.remove("hidden");
    main.style.display = 'none';
    document.querySelector('.pagination').style.display = 'none';
}

function hideSpinner() {
    loadingSpinner.classList.add("hidden");
    main.style.display = 'flex';
    document.querySelector('.pagination').style.display = 'flex';
}

function closeModal() {
    movieDetailsModal.classList.add("hidden");
    document.body.style.overflow = "auto";
    modalBody.innerHTML = "";
}

// =======================================================
// 4. EVENT LISTENERS (OUVINTES DE EVENTOS)
// =======================================================

form.addEventListener("submit", (e) => {
    e.preventDefault();
    const searchTerm = search.value;
    if (searchTerm) {
        currentPage = 1;
        const SEARCH_URL = `${BASE_URL}/search/movie?api_key=${API_KEY}&language=pt-BR&query=${searchTerm}`;
        currentUrl = SEARCH_URL;
        getMovies(currentUrl + `&page=${currentPage}`);
        search.value = "";
    }
});

homeBtn.addEventListener("click", () => {
    currentPage = 1;
    currentUrl = POPULAR_URL;
    getMovies(currentUrl + `&page=${currentPage}`);
    search.value = "";
});

nextBtn.addEventListener("click", () => {
    currentPage++;
    getMovies(currentUrl + `&page=${currentPage}`);
    window.scrollTo(0, 0);
});

prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        getMovies(currentUrl + `&page=${currentPage}`);
        window.scrollTo(0, 0);
    }
});

closeModalBtn.addEventListener("click", closeModal);
movieDetailsModal.addEventListener("click", (e) => {
    if (e.target === movieDetailsModal) closeModal();
});
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !movieDetailsModal.classList.contains("hidden")) {
        closeModal();
    }
});

// =======================================================
// 5. CHAMADA INICIAL PARA CARREGAR A PÁGINA
// =======================================================
currentUrl = POPULAR_URL;
getMovies(currentUrl + `&page=${currentPage}`);