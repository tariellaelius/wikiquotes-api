wikiquotes-api
==============

Javascript module for retrieving quotes from wikiquote.org via api calls. [See it in action!](http://natetyler.github.io)

#### queryTitles(titles, success, error)
Query based on "titles" parameter and return page id. If multiple page ids are returned, choose the first one. Query includes "redirects" option to automatically traverse redirects. All words will be capitalized as this generally yields more consistent results.

#### getSectionsForPage(data, success, error)
Get the sections for a given page. This makes parsing for quotes more manageable. Returns an array of all sections that have headings of specific format, like a letter of the alphabet or a range of letters, or other user-defined format. Returns the titles that were used in case there is a redirect.

#### getQuoteFromSection(pageId, sectionIndex, success, error)
Get a random quote from a given section. Sections are usually of the format:
```html
    <h3> title </h3>
    <ul>
      <li> 
        Quote text
        <ul>
          <li> additional info on the quote </li>
        </ul>
      </li>
    <ul>
    <ul> next quote etc... </ul>
```
    
Returns the titles that were used in case there is a redirect.

#### getRandomQuote(data, success, error)
Gets a random quote for the given title search. Queries Wikiquotes API based on a given title to get it's page id and passes that to the next function, which gets a random quote from a random section on that page. Returns the titles that were used in case there is a redirect.

#### getRandomQuoteByPageID(data, success, error)
Gets quotes from a page by first getting sections that have a heading conforming to a 
user-defined mask (if any). Otherwise, defaultMask is used to check
for headings. Randomly chooses one of these sections, then randomly chooses and extracts a quote,
which it passes to the callback function, together with the page title and the quote anchor on the page.
Expects an object with 'title' and 'masks' (optional) properties as the first argument.
'masks', if provided, should be an array containing string elements, which will be converted into regular expressions
using `new RegExp(mask)`.

#### openSearch(titles, success, error)
Search using opensearch api.  Returns an array of search results.

#### capitalizeString(string)
Capitalize the first letter of each word. This is included as a utility function for `queryTitles` as capitalized words yield more consistent search results.
