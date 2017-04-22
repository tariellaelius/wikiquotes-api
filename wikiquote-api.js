var WikiquoteApi = (function() {

  var wqa = {};

  var API_URL = "https://en.wikiquote.org/w/api.php";

  /**
   * Query based on "titles" parameter and return page id.
   * If multiple page ids are returned, choose the first one.
   * Query includes "redirects" option to automatically traverse redirects.
   * All words will be capitalized as this generally yields more consistent results.
   */
  wqa.queryTitles = function(titles, success, error) {
    $.ajax({
      url: API_URL,
      dataType: "jsonp",
      data: {
        format: "json",
        action: "query",
        redirects: "",
        titles: titles
      },

      success: function(result, status) {
        var pages = result.query.pages;
        var pageId = -1;
        for(var p in pages) {
          var page = pages[p];
          // api can return invalid recrods, these are marked as "missing"
          if(!("missing" in page)) {
            pageId = page.pageid;
            break;
          }
        }
        if(pageId > 0) {
          success(pageId);
        } else {
          error("No results");
        }
      },

      error: function(xhr, result, status){
        error("Error processing your query");
      }
    });
  };

  /**
   * Get the sections for a given page.
   * This makes parsing for quotes more manageable.
   * Returns an array of all sections that have headings of specific format, like a
   * letter of the alphabet or a range of letters.
   * Returns the titles that were used
   * in case there is a redirect.
   */
  wqa.getSectionsForPage = function(pageId, success, error) {
    $.ajax({
      url: API_URL,
      dataType: "jsonp",
            type: 'GET',
      contentType: 'text/plain',
      data: {
        format: "json",
        action: "parse",
        prop: "sections",
        pageid: pageId
      },

      success: function(result, status){
        var sectionArray = [];
        var sections = result.parse.sections;
        let size = sections.length;
        let step = 0;
        
        // Get only those sections that have headings of a specific format, like 'A' or 'W-Y'
        while (step < size) {
            if(sections[step].line.match(/^[A-Z]( ?- ?[A-Z])?$/)) {
                sectionArray.push(sections[step].index);
            }
            step++;
        }

        if(sectionArray.length === 0) {
          error('Failed to locate a matching section to fetch a quote');
        } else
            success({ titles: result.parse.title, sections: sectionArray });
      },
      error: function(xhr, result, status){
        error("Error getting sections");
      }
    });
  };

  /**
   * Get all quotes for a given section.  Most sections will be of the format:
   * <h3> title </h3>
   * <ul>
   *   <li> 
   *     Quote text
   *     <ul>
   *       <li> additional info on the quote </li>
   *     </ul>
   *   </li>
   * <ul>
   * <ul> next quote etc... </ul>
   *
   * Returns the titles that were used in case there is a redirect.
   */
  wqa.getQuotesForSection = function(pageId, sectionIndex, success, error) {
    $.ajax({
      url: API_URL,
      dataType: "jsonp",
      data: {
        format: "json",
        action: "parse",
        noimages: "",
        pageid: pageId,
        section: sectionIndex
      },

      success: function(result, status){          
        var quotes = result.parse.text["*"];
        var anchor = result.parse.sections[0].anchor;
        var quoteArray = [] 
        
        // Find top level <li>s only
        var $listItems = $(quotes).children('li');
        
        let size = $listItems.length;
        let randomNum = Math.floor(Math.random() * size);        
        
        
        /*
         * Get text contents of the top-level list items,
         * by iterating through the elements contained within
         * and ignoring the text inside the child nodes that are
         * unordered list items <ul>, because those
         * don't contain the quote itself
         */
        function getTheQuote() {
            var theQuote = [];
            $(this).contents().filter(function() { return this.nodeName != "UL"; }).each(function() {                               
                function getText() {                    
                    if(this.nodeName == "BR")
                        theQuote.push('<br />'); 
                    else if(this.nodeType === 3) {
                        theQuote.push(this.textContent);
                    }
                    else {
                        $(this).contents().each(function() {
                            getText.call(this);
                        });
                    }
                }                
                getText.call(this);              
            });
            quoteArray.push(theQuote.join(''));
        }      
        
        // Select a random list item and extract the quote from it
        getTheQuote.call($listItems.eq(randomNum));

        success({ titles: result.parse.title, quotes: quoteArray, anchor: anchor });
      },
      error: function(xhr, result, status){
        error("Error getting quotes");
      }
    });
  };
  
  /**
   * Get Wikipedia page for specific section
   * Usually section 0 includes personal Wikipedia page link
   */
  wqa.getWikiForSection = function(title, pageId, sec, success, error) {
    $.ajax({
      url: API_URL,
      dataType: "jsonp",
      data: {
        format: "json",
        action: "parse",
        noimages: "",
        pageid: pageId,
        section: sec
      },

      success: function(result, status){
		
        var wikilink;
		console.log('what is iwlink:'+result.parse.iwlinks);
		var iwl = result.parse.iwlinks;
		for(var i=0; i<(iwl).length; i++){
			var obj = iwl[i];
			if((obj["*"]).indexOf(title) != -1){
				 wikilink = obj.url;
			}
		}
        success(wikilink);
      },
      error: function(xhr, result, status){
        error("Error getting quotes");
      }
    });
  };
  /**
   * Search using opensearch api.  Returns an array of search results.
   */
  wqa.openSearch = function(titles, success, error) {
    $.ajax({
      url: API_URL,
      dataType: "jsonp",
      data: {
        format: "json",
        action: "opensearch",
        namespace: 0,
        suggest: "",
        search: titles
      },

      success: function(result, status){
        success(result[1]);
      },
      error: function(xhr, result, status){
        error("Error with opensearch for " + titles);
      }
    });
  };

  /**
   * Get a random quote for the given title search.
   * This function searches for a page id for the given title, chooses a random
   * section from the list of sections for the page, and then chooses a random
   * quote from that section.  Returns the titles that were used in case there
   * is a redirect.
   */
  wqa.getRandomQuote = function(titles, success, error) {

    var errorFunction = function(msg) {
      error(msg);
    };
    
    var chooseQuote = function(quotes) {
        // The step of choosing a random quote is moved to the getQuotesForSection function        
      success({ titles: quotes.titles, quote: quotes.quotes[0], anchor: quotes.anchor });
    };

    var getQuotes = function(pageId, sections) {
      var randomNum = Math.floor(Math.random()*sections.sections.length);
      wqa.getQuotesForSection(pageId, sections.sections[randomNum], chooseQuote, errorFunction);
    };

    var getSections = function(pageId) {
      wqa.getSectionsForPage(pageId, function(sections) { getQuotes(pageId, sections); }, errorFunction);
    };

    wqa.queryTitles(titles, getSections, errorFunction);
  };
  
  
  /*
   * Does the same thing as the above function, but bypasses the step
   * of getting the page id for a search query, by requiring the page id
   * as an argument
   */
  wqa.getRandomQuoteByPageID = function(pageID, success, error) {
      
    var errorFunction = function(msg) {
      error(msg);
    };

    var chooseQuote = function(quotes) {
        // The step of choosing a random quote is moved to the getQuotesForSection function
      success({ titles: quotes.titles, quote: quotes.quotes[0], anchor: quotes.anchor });
    };

    var getQuotes = function(pageId, sections) {
      var randomNum = Math.floor(Math.random()*sections.sections.length);
      wqa.getQuotesForSection(pageId, sections.sections[randomNum], chooseQuote, errorFunction);
    };

    var getSections = function(pageId) {
      wqa.getSectionsForPage(pageId, function(sections) { getQuotes(pageId, sections); }, errorFunction);
    };

    getSections(pageID);
  }

  /**
   * Capitalize the first letter of each word
   */
  wqa.capitalizeString = function(input) {
    var inputArray = input.split(' ');
    var output = [];
    for(s in inputArray) {
      output.push(inputArray[s].charAt(0).toUpperCase() + inputArray[s].slice(1));
    }
    return output.join(' ');
  };

  return wqa;
}());
