'use strict';

const searchForm = document.querySelector("#searchForm");
const filtersForm = document.querySelector("#filtersForm");
const searchInput = document.querySelector("#search-input");
const starsInput = document.querySelector("#repo-stars");
const typeInput = document.querySelector("#repo-type");
const sortByName = document.querySelector("#sort-by-name");
const sortByStars = document.querySelector("#sort-by-stars");

const ownerContainer = document.querySelector("#ownerContainer");
const cardsContainer = document.querySelector("#cardsContainer");

const filtersContainer = document.querySelector("#filtersContainer");
const sortingContainer = document.querySelector("#sortingContainer");


searchForm.addEventListener("submit", handleSearch);
filtersForm.addEventListener("submit", handleFiltering);
sortingContainer.addEventListener("click", e => handleSorting(e.target));

let filteredResults = [];

let filterParams = {
    starsNum: Infinity,
    repoType: 'all',
    sortedByName: false,
    sortedtByStars: false,
    sortOrder: 'default',
    cardsOnPage: 3,
}

function handleSearch(e) {
    e.preventDefault();
    searchInput.value ? getRepos().then(checkIfOwnerExists) : null;
};

async function getRepos() {
    const query = searchInput.value;
    searchForm.reset();
    try {
        const res = await fetch(`https://api.github.com/search/repositories?q=user:${query}+fork:true`);
        const data = await res.json();
        return data;
    } catch (err) {
        return console.log(err);
    }
}

function checkIfOwnerExists(data) {
    if (!data.total_count) {
        ownerContainer.innerHTML = '';
        filtersForm.classList.add('hidden');
        cardsContainer.innerHTML =
            `<p>Oops! We couldn't find an account associated with this username. Please check the spelling and try again</p>`
    } else {
        const arrayOfRepos = data.items;
        renderOwner(arrayOfRepos[0].owner);
        saveCardsData(arrayOfRepos);
    }
}

function renderOwner(owner) {
    ownerContainer.innerHTML =
        `<img class = 'userpic' src =${owner.avatar_url}>
        <h2>${owner.login}</h2>`;
}

function saveCardsData(arrayOfRepos) {
    const cardsData = arrayOfRepos.map(repo => ({
        name: repo.name,
        html_url: repo.html_url,
        description: repo.description,
        type: repo.fork ? 'fork' : 'source',
        stargazers_count: repo.stargazers_count,
        updated_at: repo.updated_at,
        language: repo.language,
    }));
    filteredResults = cardsData;
    localStorage.setItem("cardsData", JSON.stringify(cardsData));
    filterParams.cardsOnPage = 3;
    updateView(cardsData);
}

function createCardMarkup({
    name,
    html_url,
    description,
    type,
    stargazers_count,
    updated_at,
    language,
}) {
    return `
    <li class="repo-card">
    <div class="card-top">
        <a class="repo-name" href=${html_url}>${name}</a>
        <p class="repo-description">${description ? description : ''}</p>
        </div>
        <div class="card-bottom">
            <span class="tag">${type}</span>
            <span class="tag">&#11088;${stargazers_count}</span>
            <span class="tag">Last updated: ${updated_at.substr(0,10)}</span>
            ${language ? `<span class="tag">Language: ${language}</span>` : ''}
        </div>
    </li>`
};

function updateView(cardsData) {

    filtersForm.classList.remove('hidden');

    const idx = filterParams.cardsOnPage;
    const slicedCardsData = cardsData.slice(0, idx);
    const renderedCardsMarkup = slicedCardsData.reduce((acc, cardData) =>
        acc += createCardMarkup(cardData), '');

    cardsContainer.innerHTML = `
        <ul class="cardsList">${renderedCardsMarkup}</ul>`;

    if (filterParams.cardsOnPage < cardsData.length) {
        const loadMoreBtn = document.createElement('button');
        loadMoreBtn.classList.add('load-more-btn');
        loadMoreBtn.innerText = 'Load more';
        loadMoreBtn.addEventListener('click', loadMoreCards);
        cardsContainer.appendChild(loadMoreBtn);
    }
};

function loadMoreCards() {
    filterParams.cardsOnPage += 3;
    updateView(filteredResults);
}

// =================== SORTING AND FILTERING DATA ===================

function handleFiltering(e) {
    e.preventDefault();
    filterParams.starsNum = Number(starsInput.value);
    filterParams.repoType = typeInput.value;
    filterResults();
}

function handleSorting(target) {

    if (target === sortByName) {
        filterParams.sortedByName = true;
        filterParams.sortedtByStars = false;
        if (filterParams.sortOrder !== 'ascending') {
            filteredResults = filteredResults.sort((a, b) => a.name.localeCompare(b.name));
            filterParams.sortOrder = 'ascending';
        } else {
            filteredResults = filteredResults.sort((a, b) => b.name.localeCompare(a.name));
            filterParams.sortOrder = 'descending';
        }
    } else {
        filterParams.sortedtByStars = true;
        filterParams.sortedByName = false;
        if (filterParams.sortOrder !== 'ascending') {
            filteredResults = filteredResults.sort((a, b) => a.stargazers_count - b.stargazers_count);
            filterParams.sortOrder = 'ascending';
        } else {
            filteredResults = filteredResults.sort((a, b) => b.stargazers_count - a.stargazers_count);
            filterParams.sortOrder = 'descending';
        }
    }

    updateView(filteredResults);
}

function filterResults() {

    const arrayOfRepos = JSON.parse(localStorage.getItem('cardsData') || "[]");

    function filterByStars(arr) {
        const newArr = arr.filter(el => el.stargazers_count >= filterParams.starsNum)
        return newArr;
    };

    function filterByRepoType(arr) {
        if (filterParams.repoType !== 'all') {
            const newArr = arr.filter(el => el.type === filterParams.repoType);
            return newArr;
        } else {
            return arr;
        }
    };

    filteredResults = filterByStars(arrayOfRepos);
    filteredResults = filterByRepoType(filteredResults);

    filteredResults = filterParams.sortedByName ? handleSorting('sortByName') : filteredResults;
    filteredResults = filterParams.sortedByStars ? handleSorting('sortByStars') : filteredResults;

    updateView(filteredResults);
}