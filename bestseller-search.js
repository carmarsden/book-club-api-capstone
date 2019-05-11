'use strict';

const apiKey = '8d5mdorhIbdwmnPuSqbm1ywRnWQ8A6d5';


function renderList(array) {
    for (let i = 0; i < array.length; i++){
        $('#bestsellerlistresultsList').append(
          `<li><button type="button" class="bestsellerlistresultsItem" id="${array[i].primary_isbn10}">
          <img src="${array[i].book_image}" class="bestsellerbookcover" alt="Book cover image for ${array[i].title}">
          <h3>${array[i].title}</h3>
          <h4>By ${array[i].author}</h4>
          <p>Description: ${array[i].description}</p>
          </button></li>`
    )};
    $('.bestsellerlistresults').removeClass('hidden');
}

function populateListResults(responseJson) {
    const listResults = responseJson.results.books;
    console.log(listResults);
    renderList(listResults);
}


function getList(date, type) {
    // perform API call to NYT
    // run response through populateListResults
    console.log(`this is looking for list of ${type} from ${date}`);
    const url = `https://api.nytimes.com/svc/books/v3/lists/${date}/${type}.json?api-key=${apiKey}`;
    console.log(`searching at url: ${url}`);

    fetch(url)
    .then(response => response.json())
    .then(responseJson => {
        console.log(responseJson);
        populateListResults(responseJson);
    })
    .catch(err => {
        $('#js-error-message').text(`Something went wrong: ${err.message}`);
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
    // watch the form for submission
    $('.bestsellerform').submit(event => {
        event.preventDefault();
        const listDateInput = $('#bestsellerlistdate').val();
        const listDate = returnSunday(listDateInput);
        const listType = $('#bestsellerlisttype').val();
        $('#bestsellerlistresultsList').empty();
        getList(listDate, listType);
    });
}



function watchResultsList() {
    // watch the results list for when a li is clicked
    $('#bestsellerlistresultsList').on('click', '.bestsellerlistresultsItem', function() {
        console.log(`you pressed a button`);
        // get attribute .attr for the id
    });

}

$(watchForm);
$(watchResultsList);