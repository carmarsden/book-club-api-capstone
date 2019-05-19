'use strict';

const NYTapiKey = '8d5mdorhIbdwmnPuSqbm1ywRnWQ8A6d5';
const GBapiKey = 'AIzaSyCL80HUXTJM_Mt5mfwjUufdxejx83s9coA';

/* Functionality for NYT bestseller API */

function renderList(array) {
    // render each book in the array list to the DOM
    for (let i = 0; i < array.length; i++){
        $('.bestsellerresults-list').append(
          `<li><button type="button" class="bestsellerresults-item" id="${array[i].primary_isbn13}">
          <img src="${array[i].book_image}" class="results-cover" alt="Book cover image for ${array[i].title}">
          <h3 class="results-title">${array[i].title}</h3>
          <h4 class="results-author">By ${array[i].author}</h4>
          <p class="results-description">Description: ${array[i].description}</p>
          </button>
          <div class="gbinfodiv hidden" id="gbInfo${array[i].primary_isbn13}"></div></li>`
    )};
    $('.bestsellerresults').removeClass('hidden');
}

function populateListResults(responseJson) {
    // store the books as an array
    // call renderList on the books in the list
    const listResults = responseJson.results.books;
    console.log(listResults);
    renderList(listResults);
}

function getList(date, type) {
    // call NYT API for the date and list type specified
    // run function to populate results
    console.log(`this is looking for list of ${type} from ${date}`);
    const url = `https://api.nytimes.com/svc/books/v3/lists/${date}/${type}.json?api-key=${NYTapiKey}`;
    console.log(`searching at url: ${url}`);

    fetch(url)
    .then(response => response.json())
    .then(responseJson => {
        console.log(responseJson);
        populateListResults(responseJson);
    })
    .catch(err => {
        $('.error-message').removeClass('hidden');
        $('#js-error-message').append(`Something went wrong: ${err.message}`);
    });
}

function returnSunday(listDateInput) {
    // figure out what day of the week the person put in
    // convert it to Sunday:
        // dayofweek is a number, e.g. Tuesday = 2
        // if it's a 7, then no edits needed
        // if it's not a 7, need to subtract that number backwards to get to 7 (e.g. Tuesday = subtract 2 days to get to Sunday)
    // return new date in format YYYY-MM-DD
    let listDate = new Date(listDateInput);
    let dayofweek = listDate.getUTCDay();
    if (dayofweek === 7) {
        return listDateInput;
    } else {
        listDate.setUTCDate(listDate.getUTCDate() - dayofweek);        
        const newDateFormatted = listDate.toISOString().slice(0,10);
        return newDateFormatted;
    }
}

function watchForm() {
    // watch the main search form for submission
    $('.searchform').submit(event => {
        event.preventDefault();
        const listDateInput = $('#bestsellerlistdate').val();
        const listDate = returnSunday(listDateInput);
        const listType = $('#bestsellerlisttype').val();
        $('.bestsellerresults-list').empty();
        $('#js-error-message').empty();
        getList(listDate, listType);
    });
}

/* Functionality for Google Books API */

function formatCategories(volumeInfo) {
    if ('categories' in volumeInfo) {
        let categories = '<ul>';
        for (let i = 0; i < volumeInfo.categories.length; i++) {
            categories += `<li>${volumeInfo.categories[i]}</li>`
        };
        categories += '</ul>'
        return categories;
    } else {
        return 'Not available';
    }
}

function formatRatings(volumeInfo) {
    let ratings = '';
    if ('averageRating' in volumeInfo) {
        ratings = `<p>Average rating of <b>${volumeInfo.averageRating}</b> from <b>${volumeInfo.ratingsCount}</b> ratings</p>`;
    } else {
        ratings = `<p>Not available</p>`
    }
    return ratings;
}

function formatLargerImg(volumeInfo) {
    let largerImg = '';
    if ('medium' in volumeInfo.imageLinks) {
        largerImg = `<img src="${volumeInfo.imageLinks.medium}" class="moreinfo-cover" alt="Larger book cover for ${volumeInfo.title}">`;
    } else if ('small' in volumeInfo.imageLinks) {
        largerImg = `<img src="${volumeInfo.imageLinks.small}" class="moreinfo-cover" alt="Larger book cover for ${volumeInfo.title}">`;
    } else if ('thumbnail' in volumeInfo.imageLinks) {
        largerImg = `<img src="${volumeInfo.imageLinks.thumbnail}" class="moreinfo-cover" alt="Larger book cover for ${volumeInfo.title}">`;
    }
    return largerImg;
}

function renderGBinfo(volumeInfo, isbn) {
    // find the right place to put the results
    /* add a div to display the following info:
      √  Larger cover image
      √  Long description 
      √  Category/subject
      √  Page count
      √  Avg rating, # of ratings
      √  Link to Google Books page */

    const categories = formatCategories(volumeInfo);
    const ratings = formatRatings(volumeInfo);
    const largerImg = formatLargerImg(volumeInfo);

    $('.bestsellerresults-list').find(`#gbInfo${isbn}`).append(
        `<div class="moreinfo-cover-container">
            <a href="${volumeInfo.previewLink}" target="_blank">
            ${largerImg}
            <span class="moreinfo-hoverspan">More Info</span>
            </a>
        </div>
        <h3>${volumeInfo.title}</h3>
        <h4>Genre(s):</h4>${categories}
        <h4>Page Count: ${volumeInfo.pageCount}</h4>
        <h4>Ratings:</h4>${ratings}
        <h4>Description:</h4><p>${volumeInfo.description}</p>
        <a href="${volumeInfo.previewLink}" target="_blank" class="moreinfo-link">More Info</a>
        `
    );
    $('.bestsellerresults').find(`#gbInfo${isbn}`).removeClass('hidden');
}

function formatQueryParams(params) {
    const queryItems = Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    return queryItems.join('&');
}

function getGoogleBooksInfo(gbVolumeID, isbn) {
    // call Google Books API for that volume
    // pass results to another function to render relevant info to the DOM
    const params = {
        projection: 'full',
    };
    const baseURL = `https://www.googleapis.com/books/v1/volumes/${gbVolumeID}`;
    const queryString = formatQueryParams(params);
    const url = baseURL + '?' + queryString;
    const gbHeaders = new Headers({
        'x-api-key': GBapiKey
    })

    console.log(url);

    fetch(url, gbHeaders)
    .then(response => response.json())
    .then(responseJson => {
        console.log(responseJson);
        renderGBinfo(responseJson.volumeInfo, isbn);        
    })
    .catch(err => {
        console.log(err);
        $('.error-message').removeClass('hidden');
        $('#js-error-message').append(`Something went wrong: ${err.message}`);
    });

}


function getGoogleBooksID(isbn) {
    // format Google Books API call (parameters, headers)
    // call GB API on a search for the ISBN from NYT list
    // get the GB volume ID for the first result
    // pass to function to call API for the volume full info
    const params = {
        q: `ISBN:${isbn}`,
        langRestrict: 'en',
        orderBy: 'relevance',
        printType: 'books',
        projection: 'full',
        startIndex: 0,
        maxResults: 5,
    };
    const baseURL = 'https://www.googleapis.com/books/v1/volumes';
    const queryString = formatQueryParams(params);
    const url = baseURL + '?' + queryString;
    const gbHeaders = new Headers({
        'x-api-key': GBapiKey
    })

    console.log(url);

    fetch(url, gbHeaders)
    .then(response => response.json())
    .then(responseJson => {
        console.log(responseJson);
        const gbVolumeID = responseJson.items[0].id;
        getGoogleBooksInfo(gbVolumeID, isbn);        
    })
    .catch(err => {
        $('.error-message').removeClass('hidden');
        $('#js-error-message').text(`Something went wrong: ${err.message}`);
    });
}

function watchResultsList() {
    // watch the results list for when a button is clicked
    // get the ISBN for the book that was clicked
    // if the corresponding div is already unhidden, don't do anything else
    // otherwise, pass isbn to a function to call Google Books API for the ID
    $('.bestsellerresults-list').on('click', '.bestsellerresults-item', function() {
        const isbn = $(this).attr('id')
        console.log(`the ISBN for the book you clicked is ${isbn}`)
        let gbDivClass = $('.bestsellerresults-list').find(`#gbInfo${isbn}`).attr('class');
        if (gbDivClass.includes('hidden') === true) {
            getGoogleBooksID(isbn);
        }
    });

}

function loadListener() {
    watchForm();
    watchResultsList();
}

$(loadListener);