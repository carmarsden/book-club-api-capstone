'use strict';

const GBapiKey = 'AIzaSyCL80HUXTJM_Mt5mfwjUufdxejx83s9coA';



/* Formatting object/array results into a way that can be rendered */

function formatAuthors(autharray) {
    if (autharray.length === 1) {
        return `${autharray[0]}`
    } else {
        let authors = '';
        for (let i = 0; i < autharray.length; i++) {
            authors += `, ${autharray[i]}`
        };
        authors = authors.slice(2);
        return authors;
    } 
}

function formatDescription(volumeobj) {
    if ('searchInfo' in volumeobj) {
        return volumeobj.searchInfo.textSnippet;
    } else {
        return 'Not available';
    }
}

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

/* Functionality for Initial Search */

function renderResults(array) {
    // render each book in the array list to the DOM
    $('.booksearchresults').removeClass('hidden');
    for (let i = 0; i < array.length; i++){
        let authors = formatAuthors(array[i].volumeInfo.authors);
        let description = formatDescription(array[i]);

        $('.booksearchresults-list').append(
          `<li><button type="button" class="booksearchresults-item" id="${array[i].id}">
          <img src="${array[i].volumeInfo.imageLinks.thumbnail}" class="results-cover" alt="Book cover image for ${array[i].volumeInfo.title}">
          <h3 class="results-title">${array[i].volumeInfo.title}</h3>
          <h4 class="results-author">By ${authors}</h4>
          <p class="results-description">Description: ${description}</p>
          </button>
          <div class="gbinfodiv hidden" id="gbInfo${array[i].id}"></div></li>`
    )};
}


function checkForResults(responseJson) {
    if (responseJson.totalItems === 0) {
        console.log('no results');
        $('.error-message').removeClass('hidden');
        $('#js-error-message').text(`Whoops, no results found! Try another search?`);
    } else {
        renderResults(responseJson.items);
    }
}

function formatQueryParams(qparams, genparams) {
    // format qparams into one long string, formatted appropriately
    // add that string to genparams with key 'q'
    // format genparams including q into a string to append to API call

    let qstring = '';
    if (qparams.q.trim() !== '') {
        qstring += `${qparams.q}`
    }
    if (qparams.author.trim() !== '') {
        qstring += `+inauthor:"${qparams.author}"`
    }
    if (qparams.title.trim() !== '') {
        qstring += `+intitle:"${qparams.title}"`
    }
    if (qparams.subject.trim() !== '') {
        qstring += `+subject:"${qparams.subject}"`
    }

    console.log(`new qparam string is ${qstring}`);
    genparams.q = qstring;

    const queryItems = Object.keys(genparams)
      .map(key => `${key}=${genparams[key]}`);
    return queryItems.join('&');
}

function getResults(general, author, title, subject) {
    // call Google Books API for the date and list type specified
    // run function to populate results
    const qparams = {
        q: general,
        author: author,
        title: title,
        subject: subject,
    };
    const genparams = {
        langRestrict: 'en',
        orderBy: 'relevance',
        printType: 'books',
        projection: 'full',
        startIndex: 0,
        maxResults: 40,
    }
    const baseURL = 'https://www.googleapis.com/books/v1/volumes';
    const queryString = formatQueryParams(qparams, genparams);
    const url = baseURL + '?' + queryString;
    const gbHeaders = new Headers({
        'x-api-key': GBapiKey
    })

    console.log(url);

    fetch(url, gbHeaders)
    .then(response => response.json())
    .then(responseJson => {
        console.log(responseJson);
        checkForResults(responseJson);
    })
    .catch(err => {
        console.log(err);
        $('.error-message').removeClass('hidden');
        $('#js-error-message').append(`Something went wrong: ${err.message}`);
    });
}

function watchForm() {
    // watch the main search form for submission
    $('.searchform').submit(event => {
        event.preventDefault();
        const searchGeneral = $('#booksearchgeneral').val();
        const searchAuthor = $('#booksearchauthor').val();
        const searchTitle = $('#booksearchtitle').val();
        const searchSubject = $('#booksearchsubject').val();
        $('.booksearchresults-list').empty();
        $('#js-error-message').empty();
        getResults(searchGeneral, searchAuthor, searchTitle, searchSubject);
    });
}

/* Functionality for Showing More Info */

function renderGBinfo(volumeInfo, bookID) {
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

    $('.booksearchresults-list').find(`#gbInfo${bookID}`).append(
        `<div class="moreinfo-cover-container">
            <a href="${volumeInfo.previewLink}" target="_blank">
            ${largerImg}
            <span class="moreinfo-hoverspan">More Info</span>
            </a>
        </div>
        <h3>${volumeInfo.title}</h3>
        <h4>Subject(s):</h4>${categories}
        <h4>Page Count: ${volumeInfo.printedPageCount}</h4>
        <h4>Ratings:</h4>${ratings}
        <h4>Description:</h4><p>${volumeInfo.description}</p>
        <a href="${volumeInfo.previewLink}" target="_blank" class="moreinfo-link">More Info</a>
        `
    );
    $('.booksearchresults').find(`#gbInfo${bookID}`).removeClass('hidden');
}

function getGoogleBooksInfo(bookID) {
    // call Google Books API for that volume
    // pass results to another function to render relevant info to the DOM
    const url = `https://www.googleapis.com/books/v1/volumes/${bookID}?projection=full`;
    const gbHeaders = new Headers({
        'x-api-key': GBapiKey
    })

    fetch(url, gbHeaders)
    .then(response => response.json())
    .then(responseJson => {
        console.log(responseJson);
        renderGBinfo(responseJson.volumeInfo, bookID);        
    })
    .catch(err => {
        $('#js-error-message').append(`Something went wrong: ${err.message}`);
    });

}

function watchResultsList() {
    // watch the results list for when a button is clicked
    // get the id for the book that was clicked
    // if the corresponding div is already unhidden, don't do anything else
    // otherwise, pass id to a function to call Google Books API for the ID
    $('.booksearchresults-list').on('click', '.booksearchresults-item', function() {
        const bookID = $(this).attr('id')
        console.log(`the Google Books ID for the book you clicked is ${bookID}`)
        let gbDivClass = $('.booksearchresults-list').find(`#gbInfo${bookID}`).attr('class');
        if (gbDivClass.includes('hidden') === true) {
            getGoogleBooksInfo(bookID);
        }
    });

}

function loadListener() {
    watchForm();
    watchResultsList();
}

$(loadListener);